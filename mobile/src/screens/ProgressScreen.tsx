import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as api from "../api/client";
import { colors, spacing } from "../theme";

export function ProgressScreen({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<api.Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProgress(await api.getProgress());
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accuracy =
    progress?.accuracy_7d != null
      ? `${Math.round(progress.accuracy_7d * 100)}%`
      : "—";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Your progress</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : progress ? (
        <View style={styles.grid}>
          <Card label="Total XP" value={`${progress.total_xp}`} />
          <Card label="Current streak" value={`${progress.current_streak} 🔥`} />
          <Card label="Longest streak" value={`${progress.longest_streak}`} />
          <Card label="Accuracy (7d)" value={accuracy} />
          <Card label="Skills learned" value={`${progress.skills_learned}`} />
          <Card label="Skills due" value={`${progress.skills_due}`} />
        </View>
      ) : null}
    </View>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
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
  back: { color: colors.muted, fontSize: 16, width: 48 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  centered: { alignItems: "center", gap: spacing.md, marginTop: spacing.xl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    flexGrow: 1,
    flexBasis: "45%",
  },
  cardValue: { color: colors.text, fontSize: 28, fontWeight: "800" },
  cardLabel: { color: colors.muted, fontSize: 14, marginTop: spacing.xs },
  errorText: { color: colors.danger, fontSize: 16, textAlign: "center" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
});
