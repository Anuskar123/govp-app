import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// ============================================
// CONFIGURATION - Your PC's WiFi IP
// ============================================
const API_BASE_URL = 'http://172.20.10.213:8000';

const { width } = Dimensions.get('window');

// ============================================
// THEME
// ============================================
const THEME = {
  bg: '#0A0E1A',
  card: '#131829',
  cardBorder: '#1E2642',
  accent: '#00D4FF',
  accentDim: 'rgba(0,212,255,0.15)',
  success: '#00E676',
  successDim: 'rgba(0,230,118,0.15)',
  warning: '#FFB300',
  warningDim: 'rgba(255,179,0,0.15)',
  danger: '#FF1744',
  dangerDim: 'rgba(255,23,68,0.15)',
  text: '#FFFFFF',
  textDim: '#8892B0',
  textMuted: '#4A5568',
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [image, setImage] = useState(null);
  const [mrzText, setMrzText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMrz, setShowMrz] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera is required!');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const analyzeDocument = async () => {
    if (!image) {
      alert('Please select or capture an ID document image first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        type: 'image/jpeg',
        name: 'id_document.jpg',
      });
      if (mrzText.trim()) {
        formData.append('mrz_text', mrzText.trim());
      }

      const response = await fetch(`${API_BASE_URL}/analyze_id`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(`Connection failed: ${err.message}. Make sure the backend is running on ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setMrzText('');
    setResult(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="shield-check" size={32} color={THEME.accent} />
          </View>
          <Text style={styles.headerTitle}>KYC Shield</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Document Verification Engine</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Built for Nepal  •  Secure Globally</Text>
          </View>
        </View>

        {/* Image Capture Section */}
        {!result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="scan" size={18} color={THEME.accent} /> Scan Document
            </Text>

            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={resetScan}>
                  <Ionicons name="close-circle" size={28} color={THEME.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.captureButtons}>
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                  <View style={styles.captureBtnIcon}>
                    <Ionicons name="camera" size={36} color={THEME.accent} />
                  </View>
                  <Text style={styles.captureBtnText}>Camera</Text>
                  <Text style={styles.captureBtnHint}>Take a photo of the ID</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureBtn} onPress={pickImage}>
                  <View style={styles.captureBtnIcon}>
                    <MaterialCommunityIcons name="image-search" size={36} color={THEME.accent} />
                  </View>
                  <Text style={styles.captureBtnText}>Gallery</Text>
                  <Text style={styles.captureBtnHint}>Select from device</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MRZ Input Toggle */}
            {image && (
              <>
                <TouchableOpacity
                  style={styles.mrzToggle}
                  onPress={() => setShowMrz(!showMrz)}
                >
                  <FontAwesome5 name="barcode" size={16} color={THEME.accent} />
                  <Text style={styles.mrzToggleText}>
                    {showMrz ? 'Hide MRZ Input' : 'Add MRZ Text (Optional)'}
                  </Text>
                  <Ionicons
                    name={showMrz ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={THEME.textDim}
                  />
                </TouchableOpacity>

                {showMrz && (
                  <View style={styles.mrzInputContainer}>
                    <Text style={styles.mrzHint}>
                      Paste the MRZ text from the bottom of the ID document (each line separated by a newline)
                    </Text>
                    <TextInput
                      style={styles.mrzInput}
                      multiline
                      numberOfLines={4}
                      placeholder={'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10'}
                      placeholderTextColor={THEME.textMuted}
                      value={mrzText}
                      onChangeText={setMrzText}
                      autoCapitalize="characters"
                    />
                  </View>
                )}

                {/* Analyze Button */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
                    onPress={analyzeDocument}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <MaterialCommunityIcons name="magnify-scan" size={24} color="#fff" />
                    )}
                    <Text style={styles.analyzeBtnText}>
                      {loading ? 'Analyzing...' : 'Run Forensic Analysis'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={24} color={THEME.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={resetScan}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Display */}
        {result && <ResultsView result={result} onReset={resetScan} image={image} />}
      </ScrollView>
    </View>
  );
}

// ============================================
// RESULTS VIEW COMPONENT
// ============================================
function ResultsView({ result, onReset, image }) {
  const trustScore = result.combined_trust_score;
  const riskLevel = result.final_risk_level;
  const riskLabel = result.final_risk_label;

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return THEME.success;
      case 'MEDIUM': return THEME.warning;
      case 'HIGH': return THEME.danger;
      default: return THEME.textDim;
    }
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'LOW': return THEME.successDim;
      case 'MEDIUM': return THEME.warningDim;
      case 'HIGH': return THEME.dangerDim;
      default: return 'transparent';
    }
  };

  const color = getRiskColor(riskLevel);
  const bgColor = getRiskBg(riskLevel);

  return (
    <View>
      {/* Trust Score Hero */}
      <View style={[styles.trustScoreCard, { borderColor: color }]}>
        <Image source={{ uri: image }} style={styles.resultThumb} />
        <View style={[styles.trustScoreBadge, { backgroundColor: bgColor }]}>
          <Text style={[styles.trustScoreNumber, { color }]}>{trustScore}</Text>
          <Text style={styles.trustScoreLabel}>/ 100</Text>
        </View>
        <Text style={[styles.riskLevel, { color }]}>{riskLevel} RISK</Text>
        <Text style={styles.riskLabel}>{riskLabel}</Text>
      </View>

      {/* Analysis Cards */}
      {result.image_analysis && result.image_analysis.analyses && result.image_analysis.analyses.map((analysis, index) => (
        <AnalysisCard key={index} analysis={analysis} />
      ))}

      {/* MRZ Results */}
      {result.mrz_validation && <MrzResultCard mrz={result.mrz_validation} />}

      {/* Scan Another */}
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Ionicons name="refresh" size={20} color={THEME.accent} />
        <Text style={styles.resetBtnText}>Scan Another Document</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// ANALYSIS CARD COMPONENT
// ============================================
function AnalysisCard({ analysis }) {
  const isFlagged = analysis.tampering_suspected ||
    analysis.editing_suspected ||
    analysis.metadata_stripped ||
    analysis.noise_inconsistency_detected;

  const flagColor = isFlagged ? THEME.danger : THEME.success;
  const flagBg = isFlagged ? THEME.dangerDim : THEME.successDim;

  const getIcon = (technique) => {
    if (technique.includes('ELA')) return 'layers';
    if (technique.includes('EXIF')) return 'information-circle';
    if (technique.includes('Noise')) return 'pulse';
    return 'analytics';
  };

  return (
    <View style={[styles.analysisCard, { borderLeftColor: flagColor }]}>
      <View style={styles.analysisHeader}>
        <Ionicons name={getIcon(analysis.technique)} size={20} color={flagColor} />
        <Text style={styles.analysisTitle}>{analysis.technique}</Text>
        <View style={[styles.statusPill, { backgroundColor: flagBg }]}>
          <Text style={[styles.statusPillText, { color: flagColor }]}>
            {isFlagged ? 'FLAGGED' : 'CLEAR'}
          </Text>
        </View>
      </View>
      <Text style={styles.analysisDetail}>{analysis.detail}</Text>

      {analysis.technique && analysis.technique.includes('ELA') && (
        <View style={styles.metricsRow}>
          <MetricBadge label="Max Error" value={analysis.max_error} />
          <MetricBadge label="Mean Error" value={analysis.mean_error} />
          <MetricBadge label="Hotspots" value={analysis.hotspot_count} />
        </View>
      )}

      {analysis.flags && analysis.flags.length > 0 && (
        <View style={styles.flagsList}>
          {analysis.flags.map((flag, i) => (
            <View key={i} style={styles.flagItem}>
              <Ionicons name="alert-circle" size={14} color={THEME.warning} />
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {analysis.channel_stats && (
        <View style={styles.metricsRow}>
          {Object.entries(analysis.channel_stats).map(([channel, stats]) => (
            <MetricBadge key={channel} label={channel} value={stats.noise_std} />
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// MRZ RESULT CARD
// ============================================
function MrzResultCard({ mrz }) {
  const isValid = mrz.overall_valid;
  const color = isValid ? THEME.success : THEME.danger;

  return (
    <View style={[styles.analysisCard, { borderLeftColor: color }]}>
      <View style={styles.analysisHeader}>
        <FontAwesome5 name="barcode" size={18} color={color} />
        <Text style={styles.analysisTitle}>MRZ Validation ({mrz.format})</Text>
        <View style={[styles.statusPill, { backgroundColor: isValid ? THEME.successDim : THEME.dangerDim }]}>
          <Text style={[styles.statusPillText, { color }]}>
            {isValid ? 'VALID' : 'INVALID'}
          </Text>
        </View>
      </View>

      {mrz.fields && Object.keys(mrz.fields).length > 0 && (
        <View style={styles.fieldsGrid}>
          {Object.entries(mrz.fields).map(([key, value]) => (
            <View key={key} style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={styles.fieldValue}>{value || '—'}</Text>
            </View>
          ))}
        </View>
      )}

      {mrz.checks && mrz.checks.length > 0 && (
        <View style={styles.checksList}>
          <Text style={styles.checksTitle}>Checksum Verification</Text>
          {mrz.checks.map((check, i) => (
            <View key={i} style={styles.checkItem}>
              <Ionicons
                name={check.valid ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={check.valid ? THEME.success : THEME.danger}
              />
              <Text style={styles.checkText}>
                {check.field}: {check.detail}
              </Text>
            </View>
          ))}
        </View>
      )}

      {mrz.error && <Text style={styles.errorText}>{mrz.error}</Text>}
    </View>
  );
}

// ============================================
// METRIC BADGE
// ============================================
function MetricBadge({ label, value }) {
  return (
    <View style={styles.metricBadge}>
      <Text style={styles.metricValue}>{typeof value === 'number' ? value.toFixed(2) : value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.textDim,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  headerBadge: {
    marginTop: 12,
    backgroundColor: THEME.accentDim,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 11,
    color: THEME.accent,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  captureBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderStyle: 'dashed',
  },
  captureBtnIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  captureBtnHint: {
    fontSize: 11,
    color: THEME.textDim,
    marginTop: 4,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  mrzToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  mrzToggleText: {
    flex: 1,
    fontSize: 14,
    color: THEME.accent,
    fontWeight: '600',
  },
  mrzInputContainer: {
    marginBottom: 8,
  },
  mrzHint: {
    fontSize: 11,
    color: THEME.textDim,
    marginBottom: 8,
  },
  mrzInput: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 14,
    color: THEME.text,
    fontSize: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: THEME.accent,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    shadowColor: THEME.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: THEME.dangerDim,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: THEME.accent,
    fontWeight: '700',
    marginTop: 4,
  },
  trustScoreCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    backgroundColor: THEME.card,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  resultThumb: {
    width: 80,
    height: 56,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  trustScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  trustScoreNumber: {
    fontSize: 56,
    fontWeight: '900',
  },
  trustScoreLabel: {
    fontSize: 20,
    color: THEME.textDim,
    marginLeft: 4,
    fontWeight: '600',
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  riskLabel: {
    fontSize: 13,
    color: THEME.textDim,
    marginTop: 4,
    textAlign: 'center',
  },
  analysisCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderLeftWidth: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  analysisTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  analysisDetail: {
    fontSize: 12,
    color: THEME.textDim,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricBadge: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  metricLabel: {
    fontSize: 10,
    color: THEME.textDim,
    marginTop: 2,
  },
  flagsList: {
    marginTop: 10,
    gap: 6,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  flagText: {
    flex: 1,
    fontSize: 12,
    color: THEME.warning,
    lineHeight: 18,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  fieldItem: {
    backgroundColor: THEME.bg,
    borderRadius: 8,
    padding: 8,
    minWidth: '45%',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 9,
    color: THEME.textDim,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '600',
    marginTop: 2,
  },
  checksList: {
    marginTop: 12,
    gap: 6,
  },
  checksTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textDim,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  checkText: {
    flex: 1,
    fontSize: 11,
    color: THEME.textDim,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.accent,
  },
});
