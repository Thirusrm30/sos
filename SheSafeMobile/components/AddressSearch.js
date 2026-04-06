import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
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
  const debounceTimerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const searchAddress = useCallback(async (text) => {
    if (!mountedRef.current) return;
    if (text.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const result = await searchPlaces(text);
      if (mountedRef.current && result.success) {
        setPredictions(result.predictions);
        setShowSuggestions(result.predictions.length > 0);
      }
    } catch (error) {
      console.log('Place search error:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Handle input change with proper debounce
  const handleInputChange = useCallback((text) => {
    // Update input value IMMEDIATELY - no debounce on the text display
    setInputValue(text);
    onChangeText?.(text);

    // Debounce only the API search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      searchAddress(text);
    }, 400);
  }, [onChangeText, searchAddress]);

  const handleSelectPrediction = useCallback(async (prediction) => {
    setLoading(true);
    setShowSuggestions(false);

    try {
      const detailsResult = await getPlaceDetails(prediction.place_id);

      if (detailsResult.success && mountedRef.current) {
        const place = detailsResult.data;
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
      } else if (mountedRef.current) {
        setInputValue(prediction.description);
        onChangeText?.(prediction.description);
      }
    } catch (error) {
      console.log('Place details error:', error);
      if (mountedRef.current) {
        setInputValue(prediction.description);
        onChangeText?.(prediction.description);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [onChangeText, onSelect]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setPredictions([]);
    setShowSuggestions(false);
    onChangeText?.('');
    onClear?.();
  }, [onChangeText, onClear]);

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
          autoCorrect={false}
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
            scrollEnabled={predictions.length > 3}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelectPrediction(item)}
                activeOpacity={0.7}
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
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    minHeight: 48,
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
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: 220,
    ...SHADOWS.lg,
    zIndex: 1000,
    elevation: 10,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 48,
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
