'use strict';

import React, { Component } from 'react';
import { AppRegistry, AsyncStorage, Button, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

class mypace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Messages
      messages: [],

      // States
      isCalcButtonEnabled: false,
      isSaveButtonEnabled: false,

      // Settings
      kmVsMi: 'km',
      paceVsSpeed: 'pace',

      // Inputs
      distance: null,
      timeHours: null,
      timeMinutes: null,
      timeSeconds: null,
      paceHours: null,
      paceMinutes: null,
      paceSeconds: null,

      // Saved items
      savedItems: [],
    };

    this.unit = {
      mile: 1609.344, // meters per mile
      kilometer: 1000, // meters per kilometer
      hour: 3600, // seconds per hour
      minute: 60, // seconds per minute
      second: 1, // seconds per second
    };
  };

  componentDidMount() {
    this.loadInitialState().done();
  };

  loadInitialState = async () => {
    try {
      let savedItems = await AsyncStorage.getItem('savedItems');

      if (savedItems !== null) {
        this.setState({
          savedItems: JSON.parse(savedItems)
        });
        this.appendMessage('Stored items: ' + savedItems);
      } else {
        this.appendMessage('Initialized with no selection on disk.');
      }
    } catch (error) {
      this.appendMessage('AsyncStorage error: ' + error.message);
    }
  };

  appendMessage = (message) => {
    this.setState({
      messages: this.state.messages.concat(message)
    });
  };



  //
  // Distance
  //

  // Get distance (in kilometers or miles)

  getDist = () => {
    return this.state.kmVsMi === 'mi' ? this.state.distance / this.unit.mile : this.state.distance / this.unit.kilometer;
  };

  // Set distance (distance = time / pace)

  setDist = () => {
    let distance = this.getTime() && this.getPace() ? this.getTime() / this.getPace() : false;

    this.setState({
      distance: distance ? (this.state.kmVsMi === 'mi' ? distance * this.unit.mile : distance * this.unit.kilometer).toFixed(0).toString() : false
    });
  };

  // Clear distance input field

  clearDist = () => {
    this.setState({
      distance: null
    }, () => this.updateStatus());
  };



  //
  // Time
  //

  // Get time (in seconds)

  getTime = () => {
    return this.state.timeHours * this.unit.hour + this.state.timeMinutes * this.unit.minute + this.state.timeSeconds * this.unit.second;
  };

  // Set time (time = pace * distance)

  setTime = () => {
    let time = this.getPace() && this.getDist() ? this.getPace() * this.getDist() : false;

    this.setState({
      timeHours: time ? this.getHours(time) : null,
      timeMinutes: time ? this.getMinutes(time) : null,
      timeSeconds: time ? this.getSeconds(time) : null
    });
  };

  // Clear time input fields

  clearTime = () => {
    this.setState({
      timeHours: null,
      timeMinutes: null,
      timeSeconds: null
    }, () => this.updateStatus());
  };



  //
  // Pace
  //

  // Get pace (in seconds)

  getPace = () => {
    return this.state.paceHours * this.unit.hour + this.state.paceMinutes * this.unit.minute + this.state.paceSeconds * this.unit.second;
  };

  // Set pace (pace = time / distance)

  setPace = () => {
    let pace = this.getTime() && this.getDist() ? this.getTime() / this.getDist() : false;

    this.setState({
      paceHours: pace ? this.getHours(pace) : null,
      paceMinutes: pace ? this.getMinutes(pace) : null,
      paceSeconds: pace ? this.getSeconds(pace) : null
    });
  };

  // Clear pace input fields

  clearPace = () => {
    this.setState({
      paceHours: null,
      paceMinutes: null,
      paceSeconds: null
    }, () => this.updateStatus());
  };



  //
  // Time conversions
  //

  // Get hours output from seconds

  getHours = (seconds) => {
    return Math.floor(seconds / this.unit.hour) ? Math.floor(seconds / this.unit.hour).toString() : "00";
  };

  // Get minutes output from seconds

  getMinutes = (seconds) => {
    return Math.floor((seconds % this.unit.hour) / this.unit.minute) ? Math.floor((seconds % this.unit.hour) / this.unit.minute).toString() : "00";
  };

  // Get seconds output from seconds

  getSeconds = (seconds) => {
    return (seconds % this.unit.minute) ? (seconds % this.unit.minute).toFixed(0).toString() : "00"
  };



  //
  // User actions
  //

  // Focus next input field

  focusNextField = (current) => {
    this.refs[current + 1].focus();
  };

  // Update button statuses

  updateStatus = () => {
    let dist = this.getDist() > 0,
        time = this.getTime() > 0,
        pace = this.getPace() > 0;

    this.setState({
      isCalcButtonEnabled: (dist && time && !pace || dist && !time && pace || !dist && time && pace),
      isSaveButtonEnabled: false
    });    
  };

  // Calculate distance, time or pace

  calculate = () => {
    if (this.getDist() && this.getTime()) {
      this.setPace();
    } else if (this.getDist() && this.getPace()) {
      this.setTime();
    } else if (this.getTime() && this.getPace()) {
      this.setDist();
    }

    this.setState({
      isCalcButtonEnabled: false,
      isSaveButtonEnabled: true
    });
  };

  // Save calculation to your list

  saveCalculation = () => {
    let items = this.state.savedItems,
        item = {};

    item['dist'] = this.state.distance * 1;
    item['time'] = this.getTime();
    item['pace'] = this.getPace();

    items.push(item);

    AsyncStorage.setItem('savedItems', JSON.stringify(items));

    this.setState({
      'savedItems': items,
      'isSaveButtonEnabled': false
    });
  };



  //
  // Render
  //

  render() {
    return (
      <View style={styles.container}>
        <View>
          <Text style={styles.heading}>Title</Text>
        </View>

        <View>
          {this.state.messages.map((m) => <Text key={m} style={styles.introduction}>{m}</Text>)}
        </View>

        <View>
          <Text style={styles.label}>{"Distance".toUpperCase()}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              ref="1"
              autoFocus={true}
              placeholder="METERS"
              keyboardType="numeric"
              value={this.state.distance}
              maxLength={6}
              onChangeText={(distance) => this.setState({distance})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(1)}
              style={styles.input}
            />
          </View>

          <TouchableWithoutFeedback onPress={this.clearDist}>
            <View>
              <Text>Clear</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View>
          <Text style={styles.label}>{"Time".toUpperCase()}</Text>

          <View style={styles.inputContainer}>
            <TextInput 
              ref="2"
              placeholder="HH"
              keyboardType="number-pad"
              value={this.state.timeHours}
              maxLength={2}
              onChangeText={(timeHours) => this.setState({timeHours})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(2)}
              style={styles.input}
            />

            <TextInput 
              ref="3"
              placeholder="MM"
              keyboardType="number-pad"
              value={this.state.timeMinutes}
              maxLength={2}
              onChangeText={(timeMinutes) => this.setState({timeMinutes})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(3)}
              style={styles.input}
            />

            <TextInput 
              ref="4"
              placeholder="SS" 
              keyboardType="number-pad"
              value={this.state.timeSeconds}
              maxLength={2}
              onChangeText={(timeSeconds) => this.setState({timeSeconds})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(4)}
              style={styles.input}
            />
          </View>

          <TouchableWithoutFeedback onPress={this.clearTime}>
            <View>
              <Text>Clear</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View>
          <Text style={styles.label}>{'Pace'.toUpperCase()}</Text>

          <View style={styles.inputContainer}>
            <TextInput 
              ref="5"
              placeholder="HH"
              keyboardType="number-pad"
              value={this.state.paceHours}
              maxLength={2}
              onChangeText={(paceHours) => this.setState({paceHours})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(5)}
              style={styles.input}
            />

            <TextInput 
              ref="6"
              placeholder="MM" 
              keyboardType="number-pad"
              value={this.state.paceMinutes}
              maxLength={2}
              onChangeText={(paceMinutes) => this.setState({paceMinutes})}
              onEndEditing={this.updateStatus}
              onSubmitEditing={() => this.focusNextField(6)}
              style={styles.input}
            />

            <TextInput 
              ref="7"
              placeholder="SS"
              keyboardType="number-pad"
              value={this.state.paceSeconds}
              maxLength={2}
              onChangeText={(paceSeconds) => this.setState({paceSeconds})}
              onEndEditing={this.updateStatus}
              style={styles.input}
            />
          </View>

          <TouchableWithoutFeedback onPress={this.clearPace}>
            <View>
              <Text>Clear</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title="Calculate"
            accessibilityLabel="Calculate description"
            disabled={!this.state.isCalcButtonEnabled}
            onPress={this.calculate}
          />

          <Button
            title="Save"
            accessibilityLabel="Save description"
            disabled={!this.state.isSaveButtonEnabled}
            onPress={this.saveCalculation}
          />
        </View>

        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>isCalcButtonEnabled: {this.state.isCalcButtonEnabled ? 'true' : 'false'}</Text>
        </View>
      </View>
    );
  }
}



//
// Styling
//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row'
  },
  heading: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 24,
    textAlign: 'center',
  },
  introduction: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  label: {
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F7F7F7',
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    marginTop: 5,
    textAlign: 'center'
  },
  actionContainer: {
    marginTop: 20,
  },
  debugContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    margin: 20,
    padding: 15,
    backgroundColor: 'red',
  },
  debugText: {
    color: '#FFF',
    fontFamily: 'Courier',
    lineHeight: 18,
  }
});

AppRegistry.registerComponent('mypace', () => mypace);
