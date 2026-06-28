import React, { useState } from "react";
import { HomeScreen } from "./HomeScreen";
import { LessonScreen } from "./LessonScreen";

type Screen =
  | { name: "home" }
  | { name: "lesson"; lessonId: number; title: string };

export function MainNavigator() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  if (screen.name === "lesson") {
    return (
      <LessonScreen
        lessonId={screen.lessonId}
        title={screen.title}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  return (
    <HomeScreen
      onStartLesson={(lessonId, title) =>
        setScreen({ name: "lesson", lessonId, title })
      }
    />
  );
}
