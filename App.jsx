import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  const inputTextRef = useRef('');
  const previousTextToPrependRef = useRef('');
  const lastResultRef = useRef('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = Platform.OS === 'ios' ? onSpeechPartialResultsIOS : onSpeechPartialResultsAndroid;
    Voice.onSpeechError = error => console.log('onSpeechError: ', error);

    const androidPermissionChecking = async () => {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        console.log('hasPermission: ', hasPermission);
        const getService = await Voice.getSpeechRecognitionServices();
        console.log('getService: ', getService);
      }
    };
    androidPermissionChecking();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = event => {
    console.log('Recording started: ', event);
  };

  const onSpeechEnd = () => {
    console.log('Recording ended');
    setIsListening(false);
  };

  const onSpeechResults = event => {
    console.log('Speech results: ', event);
    const text = inputTextRef.current;
    setRecognizedText(text);
  };

  const onSpeechPartialResultsIOS = event => {
    console.log('Speech partial results (iOS): ', event);
    if (event.value && event.value.length > 0) {
      const partialResult = event.value[0];
      if (partialResult !== lastResultRef.current) {
        inputTextRef.current = previousTextToPrependRef.current + partialResult;
        lastResultRef.current = partialResult;
      }
    }
  };

  const onSpeechPartialResultsAndroid = event => {
    console.log('Speech partial results (Android): ', event);
    if (event.value && !event.value[0].startsWith(lastResultRef.current)) {
      previousTextToPrependRef.current = inputTextRef.current;
    }
    if (event.value && event.value.length > 0) {
      inputTextRef.current = previousTextToPrependRef.current + event.value[0];
      lastResultRef.current = event.value[0];
    }
  };

  const startListening = async () => {
    inputTextRef.current = '';
    previousTextToPrependRef.current = '';
    lastResultRef.current = '';

    setIsListening(true);
    try {
      await Voice.start('en-US', {
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
      });
    } catch (error) {
      console.log('startListening error: ', error);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop(); // stop listening
      setIsListening(false);
    } catch (error) {
      console.log('stopListening error: ', error);
    }
  };

  const sendMessage = () => {
    if (recognizedText) {
      setMessages([...messages, { text: recognizedText, sender: 'user' }]);
      setRecognizedText('');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              {
                alignSelf:
                  message.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor:
                  message.sender === 'user' ? '#BB2525' : '#141E46',
              },
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#888" // Set placeholder text color to a shade of gray
          value={recognizedText}
          onChangeText={text => setRecognizedText(text)}
        />
        <TouchableOpacity
          onPressIn={startListening}
          onPressOut={stopListening}
          style={styles.voiceButton}
        >
          {isListening ? (
            <Text style={styles.voiceButtonText}>•••</Text>
          ) : (
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/4980/4980251.png',
              }}
              style={{ width: 45, height: 45 }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E0',
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    color: 'black', // Explicitly set text color to black
  },
  voiceButton: {
    marginLeft: 10,
    fontSize: 24,
  },
  voiceButtonText: {
    fontSize: 24,
    height: 45,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6969',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;
