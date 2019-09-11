/* @flow */
import React, { Component } from 'react';
import {
  View,
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  StyleSheet,
} from 'react-native';

import type {
  CarouselProps,
  GestureEvent,
  GestureState,
  ScrollEvent,
} from '../types';

const { width: screenWidth } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type State = {
  currentIndex: number,
};

export default class SideSwipe extends Component<CarouselProps, State> {
  panResponder: PanResponder;
  list: typeof FlatList;

  static defaultProps = {
    contentOffset: 0,
    data: [],
    extractKey: (item: *, index: number) => `sideswipe-carousel-item-${index}`,
    itemWidth: screenWidth,
    onEndReached: () => {},
    onEndReachedThreshold: 0.9,
    onGestureStart: () => {},
    onGestureRelease: () => {},
    onIndexChange: () => {},
    renderItem: () => null,
    shouldCapture: ({ dx }: GestureState) => (dx * dx) > 1,
    shouldRelease: () => false,
    threshold: 0,
    useVelocityForIndex: true,
    useNativeDriver: true,
  };

  constructor(props: CarouselProps) {
    super(props);

    const currentIndex: number = props.index || 0;

    this.state = {
      currentIndex,
      currentLayout: props.layout
    };

    this.visibilityConfig = {
      itemVisiblePercentThreshold: 90,
      waitForInteraction: false
    }
  }

  componentDidUpdate = (prevProps: CarouselProps) => {
    const { contentOffset, index, layout } = this.props;

    if (Number.isInteger(index) && ( index !== this.state.currentIndex || layout !== this.state.currentLayout)) {
      this.setState(
        () => ({ currentIndex: index, currentLayout: layout }),
        () => {
          setTimeout(() =>
            this.list.scrollToIndex({
              index: this.state.currentIndex,
              viewOffset: contentOffset,
              animated: false
            })
          );
        }
      );
    }
  };

  render = () => {
    const {
      contentContainerStyle,
      contentOffset,
      data,
      extractKey,
      flatListStyle,
      renderItem,
      style,
      itemWidth,
      shouldCapture
    } = this.props;
    const { currentIndex } = this.state;
    const dataLength = data.length;

    return (
      <View
        style={[{ width: itemWidth }, style]}
      >
        <AnimatedFlatList
          ref={this.getRef}
          horizontal
          data={data}
          scrollEnabled={shouldCapture()}
          style={[styles.flatList, flatListStyle]}
          contentContainerStyle={[
            { paddingHorizontal: contentOffset },
            contentContainerStyle,
          ]}

          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}

          pagingEnabled={true}

          decelerationRate={'fast'}
          disableIntervalMomentum={false}

          onEndReached={this.props.onEndReached}
          onEndReachedThreshold={this.props.onEndReachedThreshold}

          onViewableItemsChanged={this.onViewableItemsChanged}
          viewabilityConfig={this.visibilityConfig}

          initialScrollIndex={currentIndex}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: this.xOffset } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={1}

          keyExtractor={extractKey}
          getItemLayout={this.getItemLayout}
          renderItem={({ item, index }) =>
              renderItem({
                item,
                currentIndex,
                itemIndex: index,
                itemCount: dataLength,
                animatedValue: this.transitionAnimation(index),
              })
          }
        />
      </View>
    );
  };

  onViewableItemsChanged = ({viewableItems}) => {
    if(viewableItems.length === 1) {
      this.props.onIndexChange(viewableItems[0].index);
    }
  }

  xOffset = new Animated.Value(0);

  transitionAnimation = index => {
    const { itemWidth } = this.props;
    return {
      transform: [
        { perspective: 800 },
        {
          scale: this.xOffset.interpolate({
            inputRange: [
              (index - 1) * itemWidth,
              index * itemWidth,
              (index + 1) * itemWidth
            ],
            outputRange: [0.35, 1, 0.35]
          })
        },
      ]
    };
  };

  getRef = (ref: *) => {
    if (ref) {
      this.list = ref._component ? ref._component : ref;
    }
  };

  getItemLayout = (data: Array<*>, index: number) => ({
    offset: this.props.itemWidth * index + this.props.contentOffset,
    length: this.props.itemWidth,
    index,
  });
}

const styles = StyleSheet.create({
  flatList: {
    flexGrow: 1,
  },
});
