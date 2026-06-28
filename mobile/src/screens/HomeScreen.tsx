import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing } from "../theme";

export function HomeScreen({
  onStartLesson,
}: {
  onStartLesson: (lessonId: number, title: string) => void;
}) {
  const { player, logout } = useAuth();
  const [next, setNext] = useState<api.NextItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNext(await api.getNext());
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNext();
  }, [loadNext]);

  const hasLesson = next?.lesson != null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi{player?.display_name ? `, ${player.display_name}` : ""}!
        </Text>
        <Pressable onPress={logout} hitSlop={8}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat label="XP" value={player?.total_xp ?? 0} />
        <Stat label="Streak" value={player?.current_streak ?? 0} />
        <Stat label="Best" value={player?.longest_streak ?? 0} />
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>What's next</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : error ? (
          <>
            <Text style={styles.nextBody}>{error}</Text>
            <Pressable style={styles.button} onPress={loadNext}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </>
        ) : hasLesson ? (
          <>
            <Text style={styles.nextTitle}>{next!.lesson!.title}</Text>
            <Text style={styles.nextBody}>
              {next!.item_type === "review" ? "Review session" : "New lesson"} -{" "}
              {next!.estimated_exercises} exercises
            </Text>
            <Pressable
              style={styles.button}
              onPress={() => onStartLesson(next!.lesson!.id, next!.lesson!.title)}
            >
              <Text style={styles.buttonText}>Start lesson</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.nextBody}>
            No lessons available yet. Add content in the admin to get started.
          </Text>
        )}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: { color: colors.text, fontSize: 26, fontWeight: "800" },
  logout: { color: colors.muted, fontSize: 15 },
  stats: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  nextLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nextTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  nextBody: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
});
