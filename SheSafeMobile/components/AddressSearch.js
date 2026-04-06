import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { searchPlaces, getPlaceDetails } from '../services/placesService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';

const AddressSearch = ({
  placeholder = 'Enter address',
  value,
  onChangeText,
  onSelect,
  onClear,
  style,
  inputStyle,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const handleInputChange = useCallback(
    debounce(async (text) => {
      setInputValue(text);
      onChangeText?.(text);

      if (text.length < 3) {
        setPredictions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      const result = await searchPlaces(text);
      setLoading(false);

      if (result.success) {
        setPredictions(result.predictions);
        setShowSuggestions(result.predictions.length > 0);
      }
    }, 300),
    []
  );

  const handleSelectPrediction = async (prediction) => {
    setLoading(true);
    setShowSuggestions(false);

    const detailsResult = await getPlaceDetails(prediction.place_id);
    setLoading(false);

    if (detailsResult.success) {
      const place = detailsResult.data;
      setSelectedPlace(place);
      setInputValue(place.address);
      onChangeText?.(place.address);
      onSelect?.({
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        name: place.name,
        placeId: place.placeId,
        components: place.components,
      });
    } else {
      setInputValue(prediction.description);
      onChangeText?.(prediction.description);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setPredictions([]);
    setSelectedPlace(null);
    setShowSuggestions(false);
    onChangeText?.('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
        />
        {loading && (
          <ActivityIndicator
            style={styles.loadingIcon}
            size="small"
            color={COLORS.accent}
          />
        )}
        {inputValue.length > 0 && !loading && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && predictions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text style={styles.predictionIcon}>📍</Text>
                <View style={styles.predictionTextContainer}>
                  <Text style={styles.predictionMainText} numberOfLines={1}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  <Text style={styles.predictionSecondaryText} numberOfLines={1}>
                    {item.structured_formatting?.secondary_text || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  loadingIcon: {
    marginRight: SPACING.md,
  },
  clearButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  clearText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.base,
    marginTop: 4,
    maxHeight: 200,
    ...SHADOWS.md,
    zIndex: 1000,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  predictionIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: FONTS.base,
    color: COLORS.text,
    fontWeight: FONTS.medium,
  },
  predictionSecondaryText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default AddressSearch;
