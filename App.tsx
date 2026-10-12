import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Cabbit Test</Text>
            <Text style={styles.subtitle}>Моё первое приложение на iPhone</Text>
          </View>

          <View style={styles.counter} accessible accessibilityLabel={`Нажатий: ${count}`}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.counterLabel}>Нажатий</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Нажми на меня"
            accessibilityValue={{ text: `Нажатий: ${count}` }}
            onPress={() => setCount((current) => current + 1)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Нажми на меня</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 36,
  },
  header: { alignItems: 'center', gap: 12 },
  title: { color: '#17251D', fontSize: 36, fontWeight: '700', letterSpacing: -1, textAlign: 'center' },
  subtitle: { color: '#66736B', fontSize: 17, lineHeight: 26, textAlign: 'center' },
  counter: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  count: { color: '#17251D', fontSize: 72, fontWeight: '600', fontVariant: ['tabular-nums'] },
  counterLabel: { color: '#66736B', fontSize: 16 },
  button: { backgroundColor: '#15803D', borderRadius: 20, minHeight: 64, paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center' },
  buttonPressed: { backgroundColor: '#116631', transform: [{ scale: 0.98 }] },
  buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', textAlign: 'center' },
});
