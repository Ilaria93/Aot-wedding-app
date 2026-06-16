import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { aotTheme } from '@/constants/aotTheme';
import {
  formatIbanForDisplay,
  HONEYMOON_GIFT_BANK_DETAILS,
} from '@/constants/honeymoonGift';
import { useI18n } from '@/contexts/I18nContext';
import { copyToClipboard } from '@/utils/copyToClipboard';

type BankDetailRowProps = {
  label: string;
  value: string;
  monospace?: boolean;
};

/** Single labeled row inside the bank coordinates card. */
function BankDetailRow({ label, value, monospace = false }: BankDetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, monospace && styles.detailValueMono]} selectable>
        {value}
      </Text>
    </View>
  );
}

/** Landing section with honeymoon gift message and bank transfer coordinates. */
export function HoneymoonGiftSection() {
  const { t } = useI18n();
  const [ibanCopied, setIbanCopied] = useState(false);
  const formattedIban = formatIbanForDisplay(HONEYMOON_GIFT_BANK_DETAILS.iban);

  async function handleCopyIban() {
    const copied = await copyToClipboard(HONEYMOON_GIFT_BANK_DETAILS.iban.replace(/\s+/g, ''));
    if (!copied) {
      return;
    }

    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 2200);
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('landing.gift.eyebrow')}</Text>
          <Text style={styles.title}>{t('landing.gift.title')}</Text>
          <Text style={styles.intro}>{t('landing.gift.intro')}</Text>
          <Text style={styles.gratitude}>{t('landing.gift.gratitude')}</Text>
        </View>

        <View style={styles.emblem}>
          <FontAwesome name="plane" size={22} color={aotTheme.bronze} />
          <FontAwesome name="heart" size={18} color={aotTheme.militaryGreen} />
        </View>
      </View>

      <View style={styles.coordinatesCard}>
        <Text style={styles.coordinatesTitle}>{t('landing.gift.coordinatesTitle')}</Text>

        <BankDetailRow
          label={t('landing.gift.accountHolder')}
          value={HONEYMOON_GIFT_BANK_DETAILS.accountHolder}
        />
        <BankDetailRow label={t('landing.gift.iban')} value={formattedIban} monospace />
        <BankDetailRow label={t('landing.gift.bic')} value={HONEYMOON_GIFT_BANK_DETAILS.bic} monospace />
        <BankDetailRow
          label={t('landing.gift.reference')}
          value={HONEYMOON_GIFT_BANK_DETAILS.paymentReference}
        />

        <Pressable style={styles.copyButton} onPress={handleCopyIban}>
          <FontAwesome name="copy" size={14} color={aotTheme.textPrimary} />
          <Text style={styles.copyButtonText}>
            {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: aotTheme.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 28,
    marginBottom: 20,
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    flexWrap: 'wrap',
  },
  headerCopy: {
    flex: 1,
    minWidth: 260,
  },
  eyebrow: {
    color: aotTheme.bronze,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: aotTheme.textPrimary,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 14,
  },
  intro: {
    color: aotTheme.textMuted,
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 12,
  },
  gratitude: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emblem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: aotTheme.surfaceMuted,
  },
  coordinatesCard: {
    backgroundColor: aotTheme.surfaceMuted,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: aotTheme.border,
    padding: 20,
    gap: 14,
  },
  coordinatesTitle: {
    color: aotTheme.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: aotTheme.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailValue: {
    color: aotTheme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  detailValueMono: {
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  copyButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: aotTheme.surface,
    borderWidth: 1,
    borderColor: aotTheme.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  copyButtonText: {
    color: aotTheme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
