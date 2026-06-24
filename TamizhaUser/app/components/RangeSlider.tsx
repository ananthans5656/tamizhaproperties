import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 60;
const THUMB_SIZE = 24;
const MAX_VALUE = 500;

interface RangeSliderProps {
  onValuesChange: (min: number, max: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ onValuesChange }) => {
  const [minPos, setMinPos] = useState(0);
  const [maxPos, setMaxPos] = useState(SLIDER_WIDTH);

  const minPosRef = useRef(0);
  const maxPosRef = useRef(SLIDER_WIDTH);
  const startMinPos = useRef(0);
  const startMaxPos = useRef(SLIDER_WIDTH);

  const posToValue = (pos: number) => Math.round((pos / SLIDER_WIDTH) * MAX_VALUE);

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startMinPos.current = minPosRef.current;
      },
      onPanResponderMove: (_, gs) => {
        let newPos = startMinPos.current + gs.dx;
        if (newPos < 0) newPos = 0;
        if (newPos > maxPosRef.current - THUMB_SIZE) newPos = maxPosRef.current - THUMB_SIZE;
        minPosRef.current = newPos;
        setMinPos(newPos);
        onValuesChange(posToValue(newPos), posToValue(maxPosRef.current));
      },
      onPanResponderRelease: () => {
        startMinPos.current = minPosRef.current;
      },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startMaxPos.current = maxPosRef.current;
      },
      onPanResponderMove: (_, gs) => {
        let newPos = startMaxPos.current + gs.dx;
        if (newPos > SLIDER_WIDTH) newPos = SLIDER_WIDTH;
        if (newPos < minPosRef.current + THUMB_SIZE) newPos = minPosRef.current + THUMB_SIZE;
        maxPosRef.current = newPos;
        setMaxPos(newPos);
        onValuesChange(posToValue(minPosRef.current), posToValue(newPos));
      },
      onPanResponderRelease: () => {
        startMaxPos.current = maxPosRef.current;
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>Min: {posToValue(minPos)}L</Text>
        <Text style={styles.label}>Max: {posToValue(maxPos)}L</Text>
      </View>
      <View style={styles.trackContainer}>
        <View style={styles.track} />
        <View style={[styles.activeTrack, { left: minPos, width: maxPos - minPos }]} />
        <View {...minPanResponder.panHandlers} style={[styles.thumb, { left: minPos - THUMB_SIZE / 2 }]} />
        <View {...maxPanResponder.panHandlers} style={[styles.thumb, { left: maxPos - THUMB_SIZE / 2 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    alignSelf: 'center',
    marginVertical: 15,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  activeTrack: {
    height: 4,
    backgroundColor: '#1A56DB',
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A56DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default RangeSlider;
