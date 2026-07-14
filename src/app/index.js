import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

export default function App() {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState([]);

  // Function to add a task to the list
  const handleAddTask = () => {
    if (task.trim() === '') return; 
    setTaskList([...taskList, { id: Date.now().toString(), text: task }]);
    setTask(''); 
  };

  // Function to delete a task
  const handleDeleteTask = (id) => {
    setTaskList(taskList.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        {/* App Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>iOS To-Do List</Text>
        </View>

        {/* List of Tasks */}
        <FlatList
          data={taskList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskContainer}>
              <Text style={styles.taskText}>{item.text}</Text>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteTask(item.id)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />

        {/* Input Field Section */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a task..."
            placeholderTextColor="#888"
            value={task}
            onChangeText={(text) => setTask(text)}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7', 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  taskContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  deleteButton: {
    backgroundColor: '#FF3B30', 
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderRadius: 25,
    borderColor: '#C7C7CC',
    borderWidth: 1,
    width: '80%',
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#007AFF', 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '300',
  },
});
