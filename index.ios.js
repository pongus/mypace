'use strict';

import React, { Component } from 'react';

import {
  AppRegistry,
  AsyncStorage,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import Swiper from 'react-native-swiper';



// 
// TODO:
// * Go to different views using header links
// * Remove saved items
// * Replace text with icons
// * Basic calculate button styling
// * Basic header styling
// * Add distance quick list filled with common distances
// * Validation if higher than 60 minutes and/or 60 seconds
// * Kilometer vs mile setting
// * Get splits
// * Get negative splits



class mypace extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // Configurations
      kmVsMi: 'km',
      paceVsSpeed: 'pace',

      // Views
      currentView: 1,

      // Messages
      messages: [],

      // Buttons
      isCalcButtonEnabled: false,
      isSaveButtonEnabled: false,

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
        this.appendMessage(savedItems);
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

  // Set distance (distance = time / pace)

  setDist = () => {
    let distance = this.getTime() && this.getPace() ? this.getTime() / this.getPace() : false;

    this.setState({
      distance: distance ? (this.state.kmVsMi === 'mi' ? distance * this.unit.mile : distance * this.unit.kilometer).toFixed(0).toString() : false
    });
  };

  // Get distance (in kilometers or miles)

  getDist = () => {
    return this.state.kmVsMi === 'mi' ? this.state.distance / this.unit.mile : this.state.distance / this.unit.kilometer;
  };

  // Get distance output (in meters)

  getDistOutput = (dist) => {
    return dist + ' m';
  };

  // Clear distance input field

  clearDist = () => {
    this.setState({
      distance: null
    }, () => this.updateButtonStatus());
  };



  //
  // Time
  //

  // Set time (time = pace * distance)

  setTime = () => {
    let time = this.getPace() && this.getDist() ? this.getPace() * this.getDist() : false;

    this.setState({
      timeHours: time ? this.getHours(time) : null,
      timeMinutes: time ? this.getMinutes(time) : null,
      timeSeconds: time ? this.getSeconds(time) : null
    });
  };

  // Get time (in seconds)

  getTime = () => {
    return this.state.timeHours * this.unit.hour + this.state.timeMinutes * this.unit.minute + this.state.timeSeconds * this.unit.second;
  };

  // Get pace output (in hours, minutes and seconds)

  getTimeOutput = (time) => {
    return this.getHours(time) + ':' + this.getMinutes(time) + ':' + this.getSeconds(time);
  };

  // Clear time input fields

  clearTime = () => {
    this.setState({
      timeHours: null,
      timeMinutes: null,
      timeSeconds: null
    }, () => this.updateButtonStatus());
  };



  //
  // Pace
  //

  // Set pace (pace = time / distance)

  setPace = () => {
    let pace = this.getTime() && this.getDist() ? this.getTime() / this.getDist() : false;

    this.setState({
      paceHours: pace ? this.getHours(pace) : null,
      paceMinutes: pace ? this.getMinutes(pace) : null,
      paceSeconds: pace ? this.getSeconds(pace) : null
    });
  };

  // Get pace (in seconds)

  getPace = () => {
    return this.state.paceHours * this.unit.hour + this.state.paceMinutes * this.unit.minute + this.state.paceSeconds * this.unit.second;
  };

  // Get pace output (in hours, minutes and seconds)

  getPaceOutput = (pace) => {
    return this.getHours(pace) + ':' + this.getMinutes(pace) + ':' + this.getSeconds(pace);
  };

  // Clear pace input fields

  clearPace = () => {
    this.setState({
      paceHours: null,
      paceMinutes: null,
      paceSeconds: null
    }, () => this.updateButtonStatus());
  };



  //
  // Time conversions
  //

  // Get hours output (from seconds)

  getHours = (s) => {
    let hours = Math.floor(s / this.unit.hour);
    return hours ? this.zeroPrefix(hours).toString() : '00';
  };

  // Get minutes output (from seconds)

  getMinutes = (s) => {
    let minutes = Math.floor((s % this.unit.hour) / this.unit.minute);
    return minutes ? this.zeroPrefix(minutes).toString() : '00';
  };

  // Get seconds output (from seconds)

  getSeconds = (s) => {
    let seconds = s % this.unit.minute;
    return seconds ? this.zeroPrefix(seconds.toFixed(0)).toString() : '00';
  };

  // Add leading zero if needed

  zeroPrefix = (number) => {
    return number < 10 ? '0' + number : number;
  };



  //
  // User actions
  //

  // Focus next input field

  focusNextField = (current) => {
    this.refs[current + 1].focus();
  };

  // Update button statuses

  updateButtonStatus = () => {
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
      savedItems: items,
      isSaveButtonEnabled: false
    });
  };

  setCurrentView = (event, state, context) => {
    this.setState({
      currentView: context.state.index
    });
  };

  getSavedItemsSorted = () => {
    return this.state.savedItems.sort((a, b) => a.dist - b.dist ? a.dist - b.dist : a.time - b.time);
  };

  renderListHeader = () => {
    return (
      <View style={styles.listItem}>
        <Text style={styles.listHeader}>Distance</Text>
        <Text style={styles.listHeader}>Time</Text>
        <Text style={styles.listHeader}>Pace</Text>
      </View>
    );
  };



  //
  // Render
  //

  render() {
    return (
      <Swiper loop={false} index={this.state.currentView} showsPagination={false} onMomentumScrollEnd={this.setCurrentView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.heading}>Saved</Text>

            <TouchableWithoutFeedback onPress={this.showMainView}>
              <View>
                <Text>Calculate</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View>
            <FlatList
              style={styles.listContainer}
              data={this.getSavedItemsSorted()}
              ListHeaderComponent={this.renderListHeader}
              renderItem={({item, index}) => (
                <View style={styles.listItem}>
                  <Text style={styles.listData}>{this.getDistOutput(item.dist)}</Text>
                  <Text style={styles.listData}>{this.getTimeOutput(item.time)}</Text>
                  <Text style={styles.listData}>{this.getPaceOutput(item.pace)}</Text>
                </View>
              )}
            />
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableWithoutFeedback onPress={this.showSavedView}>
              <View>
                <Text>Saved</Text>
              </View>
            </TouchableWithoutFeedback>

            <Text style={styles.heading}>Calculate</Text>

            <TouchableWithoutFeedback onPress={this.showConfigView}>
              <View>
                <Text>Config</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View>
            <Text style={styles.introduction}>Lorem ipsum dolor set amit...</Text>
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
                maxLength={8}
                onChangeText={(distance) => this.setState({distance})}
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
                onEndEditing={this.updateButtonStatus}
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
              accessibilityLabel="Calculate description here..."
              disabled={!this.state.isCalcButtonEnabled}
              onPress={this.calculate}
            />

            <Button
              title="Save"
              accessibilityLabel="Save description here..."
              disabled={!this.state.isSaveButtonEnabled}
              onPress={this.saveCalculation}
            />
          </View>

          <View style={styles.debugContainer}>
            {this.state.messages.map((msg) => <Text key={msg} ellipsizeMode="tail" numberOfLines={3} style={styles.debugText}>{msg}</Text>)}
          </View>
        </View>

        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableWithoutFeedback onPress={this.showMainView}>
              <View>
                <Text>Calculate</Text>
              </View>
            </TouchableWithoutFeedback>

            <Text style={styles.heading}>Config</Text>
          </View>
        </View>
      </Swiper>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  heading: {
    flex: 1,
    fontSize: 24,
    textAlign: 'center',
  },
  introduction: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row'
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
  },
  actionContainer: {
    marginTop: 20,
  },
  listContainer: {
  },
  listItem: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  listHeader: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listData: {
    flex: 1,
    fontSize: 16,
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
