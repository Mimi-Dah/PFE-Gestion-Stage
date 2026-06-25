import React, { useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Bell, ArrowLeft, CheckCircle, Clock, Briefcase, Info, Trash2, CheckCheck, Trash } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '../../theme/fonts';
import useLayoutStore from '../../store/layoutStore';
import { getColors } from '../../theme/colors';
import api from '../../services/api';

const TYPE_CONFIGS = [
  { match: ['candidature'],                   icon: Briefcase,   color: '#2563EB', bg: '#EFF6FF', darkBg: '#0D1F3C' },
  { match: ['stage', 'convention', 'actif'],  icon: CheckCircle, color: '#10B981', bg: '#ECFDF5', darkBg: '#0A2418' },
  { match: ['alerte', 'info', 'inscription'], icon: Info,        color: '#F59E0B', bg: '#FFFBEB', darkBg: '#2A1F00' },
];
const TYPE_DEFAULT = { icon: Bell, color: '#64748B', bg: '#F1F5F9', darkBg: '#1E293B' };

function getTypeConfig(typeEvent) {
  const t = (typeEvent || '').toLowerCase();
  return TYPE_CONFIGS.find((c) => c.match.some((k) => t.includes(k))) ?? TYPE_DEFAULT;
}

async function fetchNotifications() {
  try {
    const r = await api.get('notifications/');
    return r.data?.results ?? r.data ?? [];
  } catch {
    return [];
  }
}

/* ── Swipeable delete action ── */
function DeleteAction({ onDelete, dragX, deleteLabel }) {
  const translateX = dragX.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={[s.deleteWrap, { transform: [{ translateX }] }]}>
      <TouchableOpacity style={s.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
        <Trash2 size={20} color="#fff" strokeWidth={2} />
        <Text style={s.deleteBtnText}>{deleteLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Single notification card ── */
function NotifRow({ item, C, isDark, onDelete, deleteLabel }) {
  const swipeRef = useRef(null);
  const cfg       = getTypeConfig(item.type_event);
  const NotifIcon = cfg.icon;
  const iconBg    = isDark ? cfg.darkBg : cfg.bg;

  const handleDelete = () => {
    swipeRef.current?.close();
    onDelete(item.id_notification);
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={(_, dragX) => (
        <DeleteAction onDelete={handleDelete} dragX={dragX} deleteLabel={deleteLabel} />
      )}
      rightThreshold={60}
      overshootRight={false}
    >
      <View
        style={[
          s.notifCard,
          {
            backgroundColor: C.bgCard,
            borderColor: C.border,
            opacity: item.est_lue ? 0.6 : 1,
          },
        ]}
      >
        {!item.est_lue && <View style={[s.unreadBar, { backgroundColor: C.primary }]} />}
        <View style={[s.notifIcon, { backgroundColor: iconBg }]}>
          <NotifIcon size={18} color={cfg.color} strokeWidth={1.8} />
        </View>
        <View style={s.notifBody}>
          <Text style={[s.notifTitle, { color: C.text }]} numberOfLines={2}>
            {item.titre || 'Notification'}
          </Text>
          {item.message ? (
            <Text style={[s.notifContent, { color: C.textSub }]} numberOfLines={2}>
              {item.message}
            </Text>
          ) : null}
          <View style={s.notifFooter}>
            <Clock size={11} color={C.textMuted} strokeWidth={1.8} />
            <Text style={[s.notifDate, { color: C.textMuted }]}>
              {item.cree_le
                ? new Date(item.cree_le).toLocaleDateString(undefined, {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                : ''}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { t }  = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = useLayoutStore((st) => st.isDarkMode);
  const C      = getColors(isDark);
  const qc     = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  fetchNotifications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`notifications/${id}/`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old = []) => old.filter((n) => n.id_notification !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('notifications/marquer-toutes-lues/'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('notifications/supprimer-toutes/'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], []);
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifs.filter((n) => !n.est_lue).length;

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 14, backgroundColor: C.bgCard, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={s.backBtn}>
          <ArrowLeft size={22} color={C.text} strokeWidth={2} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.pageTitle, { color: C.text }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={[s.unreadBadge, { backgroundColor: C.primary }]}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Action bar ── */}
      {notifs.length > 0 && (
        <View style={[s.actionBar, { backgroundColor: C.bgMuted, borderBottomColor: C.border }]}>
          <Text style={[s.hintText, { color: C.textMuted }]}>
            {t('notifications.swipeHint')}
          </Text>
          <View style={s.actionBtns}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.primarySoft }]}
                onPress={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                activeOpacity={0.7}
              >
                <CheckCheck size={13} color={C.primary} strokeWidth={2} />
                <Text style={[s.actionBtnText, { color: C.primary }]}>{t('notifications.markAllRead')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}
              onPress={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              activeOpacity={0.7}
            >
              <Trash size={13} color="#EF4444" strokeWidth={2} />
              <Text style={[s.actionBtnText, { color: '#EF4444' }]}>{t('notifications.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} /></View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => String(item.id_notification)}
          renderItem={({ item }) => (
            <NotifRow
              item={item}
              C={C}
              isDark={isDark}
              deleteLabel={t('notifications.deleteBtn')}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <View style={[s.emptyIconBox, { backgroundColor: C.bgMuted }]}>
                <Bell size={32} color={C.textMuted} strokeWidth={1.5} />
              </View>
              <Text style={[s.emptyTitle, { color: C.text }]}>{t('notifications.empty')}</Text>
              <Text style={[s.emptyBody, { color: C.textSub }]}>{t('notifications.emptySubtitle')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pageTitle:    { fontFamily: F.bold, fontSize: 18 },
  unreadBadge:  { borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { fontFamily: F.bold, fontSize: 11, color: '#fff' },

  /* Action bar */
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  hintText:   { fontFamily: F.reg, fontSize: 11 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  actionBtnText: { fontFamily: F.semi, fontSize: 12 },

  /* Card */
  notifCard: {
    flexDirection: 'row', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14,
    overflow: 'hidden',
  },
  unreadBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  notifIcon:    { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody:    { flex: 1, gap: 4 },
  notifTitle:   { fontFamily: F.semi, fontSize: 14, lineHeight: 20 },
  notifContent: { fontFamily: F.reg, fontSize: 13, lineHeight: 19 },
  notifFooter:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  notifDate:    { fontFamily: F.reg, fontSize: 11 },

  /* Swipe delete */
  deleteWrap: {
    width: 100, justifyContent: 'center', alignItems: 'flex-end',
  },
  deleteBtn: {
    flex: 1, width: 90,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center', gap: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteBtnText: { fontFamily: F.semi, fontSize: 11, color: '#fff' },

  /* Empty */
  emptyWrap:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:   { fontFamily: F.semi, fontSize: 17, textAlign: 'center' },
  emptyBody:    { fontFamily: F.reg, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
