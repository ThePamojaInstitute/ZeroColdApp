import React from "react";
import { StyleSheet, Text, View, TextInput, Button, TouchableOpacity } from "react-native";

export const CreateAccountScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.create}>Create Account</Text>
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#000000"
        /> 
      </View> 
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#000000"
          secureTextEntry={true}
        /> 
      </View> 
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000000"
          secureTextEntry={true}
        /> 
      </View> 
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#000000"
          secureTextEntry={true}
        /> 
      </View>
      <TouchableOpacity style={styles.createBtn} /*onPress={}*/>
        <Text style={styles.createBtnText}>Sign Up</Text>
      </TouchableOpacity>
    </View> 
  );
}

export default CreateAccountScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  inputView: {
    backgroundColor: "#D3D3D3",
    borderRadius: 30,
    width: "70%",
    height: 45,
    marginBottom: 10,
    marginTop: 5,
  },
  create: {
    color: "#000000",
    height: 140,
    fontSize: 48
  },
  input: {
    flex: 1,
    padding: 10,
    marginLeft: 10,
    fontSize: 15,
  },
  createBtn: {
    title: "Login",
    width: "85%",
    borderRadius: 25,
    marginTop: 30,
    height: 50,
    alignItems: "center",
    backgroundColor: "#6A6A6A",
  },
  createBtnText: {
    color: "#FFFFFF",
    padding: 15,
    marginLeft: 10,
    fontSize: 15,
  },
  signUpBtn: {
    title: "Sign Up",
    width: "85%",
    borderRadius: 25,
    marginTop: 15,
    height: 50,
    alignItems: "center",
    backgroundColor: "#A9A9A9",
  },
  signUpBtnText: {
      color: "#FFFFFF",
      padding: 15,
      marginLeft: 10,
      fontSize: 15,
  }
});