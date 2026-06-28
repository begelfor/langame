import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing } from "../theme";

export function HomeScreen() {
  const { player, logout } = useAuth();

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
        <Text style={styles.nextTitle}>Your first lesson is on the way</Text>
        <Text style={styles.nextBody}>
          Lessons and the daily review loop arrive in the next milestones (M1-M4).
          This screen will soon be driven by the backend's GET /me/next endpoint.
        </Text>
        <View style={styles.placeholderButton}>
          <Text style={styles.placeholderButtonText}>Start lesson (coming soon)</Text>
        </View>
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
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  logout: {
    color: colors.muted,
    fontSize: 15,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
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
  nextTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  nextBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderButton: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  placeholderButtonText: {
    color: colors.muted,
    fontWeight: "700",
  },
});
