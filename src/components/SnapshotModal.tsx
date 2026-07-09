import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { theme, normalize } from '../theme/designSystem';
import { VText, VButton, VCard } from './SharedComponents';
import { Ionicons } from './VIcons';

interface SnapshotModalProps {
  visible: boolean;
  onClose: () => void;
  onPost: (image: string, caption: string) => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ visible, onClose, onPost }) => {
  const [caption, setCaption] = useState('');

  // Mock image for demo purposes
  const mockImages = [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80',
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
  ];
  const [selectedImage, setSelectedImage] = useState(mockImages[0]);

  const handlePost = () => {
    if (!caption.trim()) return;
    onPost(selectedImage, caption);
    setCaption('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <VCard style={styles.modalCard}>
          <View style={styles.header}>
            <VText variant="h2">Daily Snapshot</VText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <VText variant="body" color={theme.colors.textMuted} style={styles.subtitle}>
            Post a quick update to rank higher on the map today!
          </VText>

          <View style={styles.imageSelector}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
              {mockImages.map((img) => (
                <TouchableOpacity
                  key={img}
                  onPress={() => setSelectedImage(img)}
                  style={[styles.smallPreview, selectedImage === img && styles.selectedImage]}
                >
                  <Image source={{ uri: img }} style={styles.smallImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            placeholder="What's fresh today? (e.g. Fresh Jollof ready!)"
            placeholderTextColor={theme.colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            maxLength={150}
            multiline
            style={[styles.captionInput, { fontFamily: theme.typography.fontSans }]}
          />

          <VText variant="caption" align="right" color={theme.colors.textMuted} style={{ marginBottom: 16 }}>
            {caption.length}/150
          </VText>

          <VButton
            title="Post to Locality Feed"
            onPress={handlePost}
            disabled={!caption.trim()}
          />
        </VCard>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
  },
  imageSelector: {
    marginBottom: theme.spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: normalize(200),
    borderRadius: normalize(12),
    marginBottom: 12,
  },
  imageScroll: {
    gap: 8,
  },
  smallPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: theme.colors.primary,
  },
  smallImg: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    padding: theme.spacing.md,
    height: normalize(80),
    textAlignVertical: 'top',
    fontSize: normalize(14),
    color: theme.colors.textMain,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
