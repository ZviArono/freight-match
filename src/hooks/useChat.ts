"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import type { Message, Profile } from "@/types/database";

export interface MessageWithSender extends Message {
  sender: Pick<Profile, "display_name" | "avatar_url"> | null;
}

interface UseChatReturn {
  messages: MessageWithSender[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export function useChat(negotiationId: string): UseChatReturn {
  const { user } = useAuth();
  const supabase = createClient();

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cache sender profiles to avoid redundant fetches
  const profileCache = useRef<
    Map<string, Pick<Profile, "display_name" | "avatar_url">>
  >(new Map());

  // Fetch initial messages
  useEffect(() => {
    if (!negotiationId) return;

    async function fetchMessages() {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            "*, sender:profiles!messages_sender_id_fkey(display_name, avatar_url)"
          )
          .eq("negotiation_id", negotiationId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Failed to fetch messages:", error.message);
          return;
        }

        const messagesWithSender: MessageWithSender[] = (data || []).map(
          (msg: Record<string, unknown>) => {
            const sender = msg.sender as Pick<
              Profile,
              "display_name" | "avatar_url"
            > | null;

            // Cache the sender profile
            if (sender && typeof msg.sender_id === "string") {
              profileCache.current.set(msg.sender_id, sender);
            }

            return {
              id: msg.id as string,
              negotiation_id: msg.negotiation_id as string,
              sender_id: msg.sender_id as string,
              content: msg.content as string,
              message_type: msg.message_type as Message["message_type"],
              negotiation_event_id:
                (msg.negotiation_event_id as string) || null,
              is_read: msg.is_read as boolean,
              created_at: msg.created_at as string,
              sender,
            };
          }
        );

        setMessages(messagesWithSender);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [negotiationId]);

  // Fetch a sender profile if not in cache
  const fetchSenderProfile = useCallback(
    async (
      senderId: string
    ): Promise<Pick<Profile, "display_name" | "avatar_url"> | null> => {
      // Check cache first
      const cached = profileCache.current.get(senderId);
      if (cached) return cached;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", senderId)
          .single();

        if (error || !data) return null;

        const profile = data as Pick<Profile, "display_name" | "avatar_url">;
        profileCache.current.set(senderId, profile);
        return profile;
      } catch {
        return null;
      }
    },
    [supabase]
  );

  // Subscribe to realtime new messages
  useEffect(() => {
    if (!negotiationId) return;

    const channel = supabase
      .channel(`chat-${negotiationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `negotiation_id=eq.${negotiationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Fetch sender profile
          const sender = await fetchSenderProfile(newMessage.sender_id);

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender,
          };

          setMessages((prev) => {
            // Avoid duplicates (in case we already added via optimistic update)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, messageWithSender];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [negotiationId, fetchSenderProfile]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !negotiationId || !content.trim()) return;

      try {
        const { error } = await supabase.from("messages").insert({
          negotiation_id: negotiationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: "text" as const,
        });

        if (error) {
          console.error("Failed to send message:", error.message);
          throw new Error(error.message);
        }
      } catch (err) {
        console.error("Failed to send message:", err);
        throw err;
      }
    },
    [negotiationId, user, supabase]
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
