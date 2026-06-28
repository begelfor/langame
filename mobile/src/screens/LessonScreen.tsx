import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing } from "../theme";

type Phase = "loading" | "playing" | "submitting" | "done" | "error";

export function LessonScreen({
  lessonId,
  title,
  onExit,
}: {
  lessonId: number;
  title: string;
  onExit: () => void;
}) {
  const { addXp } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [lesson, setLesson] = useState<api.LessonDTO | null>(null);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<api.AttemptInput[]>([]);
  const [result, setResult] = useState<api.AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState<number>(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getLesson(lessonId);
        setLesson(data);
        setShownAt(Date.now());
        setPhase(data.exercises.length ? "playing" : "error");
        if (!data.exercises.length) setError("This lesson has no exercises yet.");
      } catch (err) {
        setError(err instanceof api.ApiError ? err.message : "Failed to load lesson");
        setPhase("error");
      }
    })();
  }, [lessonId]);

  const exercises = lesson?.exercises ?? [];
  const current = exercises[index];

  const submitAll = useCallback(
    async (finalAttempts: api.AttemptInput[]) => {
      setPhase("submitting");
      try {
        const res = await api.postAttempts(lessonId, finalAttempts);
        addXp(res.xp_awarded);
        setResult(res);
        setPhase("done");
      } catch (err) {
        setError(err instanceof api.ApiError ? err.message : "Failed to submit");
        setPhase("error");
      }
    },
    [lessonId, addXp],
  );

  const onAnswered = useCallback(
    (isCorrect: boolean, answerGiven: string) => {
      if (!current) return;
      const attempt: api.AttemptInput = {
        exercise_id: current.id,
        is_correct: isCorrect,
        latency_ms: Date.now() - shownAt,
        answer_given: answerGiven,
      };
      const updated = [...attempts, attempt];
      setAttempts(updated);
      if (index + 1 < exercises.length) {
        setIndex(index + 1);
        setShownAt(Date.now());
      } else {
        submitAll(updated);
      }
    },
    [current, shownAt, attempts, index, exercises.length, submitAll],
  );

  if (phase === "loading" || phase === "submitting") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>
          {phase === "submitting" ? "Saving your answers..." : "Loading lesson..."}
        </Text>
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={onExit}>
          <Text style={styles.primaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "done" && result) {
    const correct = attempts.filter((a) => a.is_correct).length;
    return (
      <View style={styles.centered}>
        <Text style={styles.doneTitle}>Lesson complete!</Text>
        <Text style={styles.doneScore}>
          {correct} / {attempts.length} correct
        </Text>
        <Text style={styles.xp}>+{result.xp_awarded} XP</Text>
        <Pressable style={styles.primaryButton} onPress={onExit}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={8}>
          <Text style={styles.muted}>Close</Text>
        </Pressable>
        <Text style={styles.progress}>
          {index + 1} / {exercises.length}
        </Text>
      </View>
      <Text style={styles.lessonTitle}>{title}</Text>
      {current && <ExerciseView key={current.id} exercise={current} onAnswered={onAnswered} />}
    </View>
  );
}

function ExerciseView({
  exercise,
  onAnswered,
}: {
  exercise: api.ExerciseDTO;
  onAnswered: (isCorrect: boolean, answerGiven: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const answer = exercise.payload.answer ?? "";
  const promptText = useMemo(() => {
    const p = exercise.payload.prompt ?? {};
    if (p.hebrew) return p.hebrew;
    return "Choose the correct answer";
  }, [exercise]);

  const revealed = selected != null;

  if (exercise.type === "typing") {
    return (
      <View style={styles.exercise}>
        <Text style={styles.promptLabel}>Type in English</Text>
        <Text style={styles.prompt}>{promptText}</Text>
        <TextInput
          style={styles.input}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          placeholder="Your answer"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={[styles.primaryButton, !typed && styles.disabled]}
          disabled={!typed}
          onPress={() =>
            onAnswered(
              typed.trim().toLowerCase() === answer.trim().toLowerCase(),
              typed,
            )
          }
        >
          <Text style={styles.primaryButtonText}>Check</Text>
        </Pressable>
      </View>
    );
  }

  const options = exercise.payload.options ?? [];

  return (
    <View style={styles.exercise}>
      <Text style={styles.promptLabel}>Translate to English</Text>
      <Text style={styles.prompt}>{promptText}</Text>
      <View style={styles.options}>
        {options.map((opt) => {
          const isAnswer = opt === answer;
          const isSelected = opt === selected;
          let optStyle = styles.option;
          if (revealed && isAnswer) optStyle = styles.optionCorrect;
          else if (revealed && isSelected) optStyle = styles.optionWrong;
          return (
            <Pressable
              key={opt}
              style={optStyle}
              disabled={revealed}
              onPress={() => setSelected(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.primaryButton, !revealed && styles.disabled]}
        disabled={!revealed}
        onPress={() => onAnswered(selected === answer, selected ?? "")}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muted: { color: colors.muted, fontSize: 15 },
  progress: { color: colors.muted, fontSize: 15, fontWeight: "700" },
  lessonTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  exercise: { gap: spacing.md, marginTop: spacing.lg },
  promptLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  prompt: { color: colors.text, fontSize: 32, fontWeight: "800" },
  options: { gap: spacing.sm, marginTop: spacing.sm },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionCorrect: {
    backgroundColor: colors.surface,
    borderColor: colors.success,
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionWrong: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.md,
  },
  optionText: { color: colors.text, fontSize: 18, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.text,
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  errorText: { color: colors.danger, fontSize: 16, textAlign: "center" },
  doneTitle: { color: colors.text, fontSize: 28, fontWeight: "800" },
  doneScore: { color: colors.muted, fontSize: 18 },
  xp: { color: colors.success, fontSize: 22, fontWeight: "800" },
});
