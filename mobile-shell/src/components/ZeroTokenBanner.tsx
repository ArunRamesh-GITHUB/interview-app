import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ZeroTokenBannerProps {
  visible: boolean
  onBuyTokensPress: () => void
  currentTokens?: number
}

const ZeroTokenBanner: React.FC<ZeroTokenBannerProps> = ({ 
  visible, 
  onBuyTokensPress, 
  currentTokens = 0 
}) => {
  if (!visible || currentTokens > 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>⚡ Out of Tokens</Text>
          <Text style={styles.subtitle}>
            You need tokens to start interviews and practice sessions
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={onBuyTokensPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Buy Tokens</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF3B30',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
})

export default ZeroTokenBanner