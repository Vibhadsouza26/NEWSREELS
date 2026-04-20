import React, { createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePersonalization } from '../hooks/usePersonalization';

const queryClient = new QueryClient();

interface PersonalizationContextType {
  trackView: (category: string) => void;
  trackOpen: (category: string) => void;
  trackSave: (category: string) => void;
  getScores: () => Record<string, number>;
}

export const PersonalizationContext = createContext<PersonalizationContextType>({
  trackView: () => {},
  trackOpen: () => {},
  trackSave: () => {},
  getScores: () => ({}),
});

export function usePersonalizationContext() {
  return useContext(PersonalizationContext);
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000',padding:20}}>
          <Text style={{color:'#fff',fontSize:18,fontWeight:'bold',marginBottom:8}}>Something went wrong</Text>
          <Text style={{color:'rgba(255,255,255,0.6)',textAlign:'center',marginBottom:20}}>{this.state.error?.message}</Text>
          <TouchableOpacity onPress={() => this.setState({hasError:false,error:null})} style={{backgroundColor:'#333',paddingHorizontal:20,paddingVertical:10,borderRadius:8}}>
            <Text style={{color:'#fff'}}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const personalization = usePersonalization();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <QueryClientProvider client={queryClient}>
          <PersonalizationContext.Provider value={personalization}>
            <ErrorBoundary>
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="article" />
                <Stack.Screen name="saved" />
              </Stack>
            </ErrorBoundary>
          </PersonalizationContext.Provider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
