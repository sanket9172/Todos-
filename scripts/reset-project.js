import React from 'react';
import { StyleSheet, Text, View } from 'react-native'; // 1. Mobile specific imports

export default function App() {
  return (
    <View style={styles.container}> 
      <Text style={styles.text}>Hello, World!</Text> 
    </View>
  );
}

// 2. Mobile styles use JavaScript layout properties instead of CSS strings
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
