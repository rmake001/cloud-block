import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const WORD_LINES = ["Cloud", "Block"];

export default function CloudLogo({ active, onComplete }) {
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) return undefined;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 3900,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onCompleteRef.current?.();
    });
    return () => animation.stop();
  }, [active, progress]);

  if (!active) return null;

  const wordScale = progress.interpolate({
    inputRange: [0.16, 0.5, 0.82, 1],
    outputRange: [0.97, 1, 1, 1.04],
  });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.overlay}
    >
      <View style={styles.wordmark}>
        {WORD_LINES.map((line, lineIndex) => (
          <View key={line} style={styles.wordmarkLine}>
            {Array.from(line, (letter, letterIndex) => {
              const index =
                WORD_LINES.slice(0, lineIndex).join("").length + letterIndex;
              const start = 0.12 + index * 0.026;
              const opacity = progress.interpolate({
                inputRange: [start, start + 0.16, start + 0.45, 0.98],
                outputRange: [0, 1, 1, 0],
                extrapolate: "clamp",
              });
              const settle = progress.interpolate({
                inputRange: [start, start + 0.3],
                outputRange: [10, 0],
                extrapolate: "clamp",
              });
              return (
                <View key={`${letter}-${index}`} style={styles.letter}>
                  <Animated.Text
                    style={[
                      styles.letterText,
                      {
                        opacity,
                        transform: [
                          { translateY: settle },
                          { scale: wordScale },
                        ],
                      },
                    ]}
                  >
                    {letter}
                  </Animated.Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: -3,
  },
  letter: {
    position: "relative",
  },
  letterText: {
    color: "#F7FAFF",
    fontFamily: "serif",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
    textShadowColor: "rgba(214, 234, 255, 0.66)",
    textShadowRadius: 12,
  },
});
