import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Styles from './styles/Styles';

export default function App() {
  return (
    <View style={Styles.subject}>
      <Text>Open up App.js your app!</Text>
      <StatusBar/>
    </View>
  );
}
