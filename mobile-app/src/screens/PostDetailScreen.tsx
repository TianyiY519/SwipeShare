import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import api from '../api';
import ReportModal from './ReportModal';

interface CommentUser { id: number; full_name: string }
interface Comment {
  id: number;
  user: CommentUser;
  content: string;
  image: string | null;
  parent: number | null;
  likes_count: number;
  replies: Comment[];
  created_at: string;
}

interface Post {
  id: number;
  user: { id: number; full_name: string };
  category: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  can_edit?: boolean;
  created_at: string;
}

const CAT_LABELS: Record<string, string> = {
  housing: 'Housing & Sublets', marketplace: 'Marketplace',
  rideshare: 'Ride Sharing', events: 'Events', general: 'General',
};

export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);
  const commentRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          api.get(`/api/forum/posts/${postId}/`),
          api.get('/api/forum/comments/', { params: { post: postId } }),
        ]);
        setPost(postRes.data);
        setLikes(postRes.data.likes_count);
        setLiked(postRes.data.is_liked ?? false);
        setComments(commentsRes.data.results || commentsRes.data);
        // Trigger view count
        api.post(`/api/forum/posts/${postId}/view/`).catch(() => {});
      } catch {
        Alert.alert('Error', 'Failed to load post');
      } finally { setLoading(false); }
    })();
  }, [postId]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/api/forum/posts/${postId}/like/`);
      setLiked(res.data.liked);
      setLikes(res.data.likes_count);
    } catch {}
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      setCommenting(true);
      const res = await api.post('/api/forum/comments/', { post: postId, content: newComment.trim() });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
    } catch {} finally { setCommenting(false); }
  };

  const doDelete = async () => {
    try {
      await api.delete(`/api/forum/posts/${postId}/`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.response?.data?.detail || 'Could not delete post');
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this post?')) doDelete();
    } else {
      Alert.alert('Delete Post', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading || !post) {
    return <View style={s.center}><ActivityIndicator size="large" color="#800000" /></View>;
  }

  const isOwner = post.can_edit === true;
  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container}>
        <View style={s.postCard}>
          <View style={s.metaRow}>
            <View style={s.catBadge}><Text style={s.catText}>{CAT_LABELS[post.category] || post.category}</Text></View>
            <Text style={s.date}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>

          <Text style={s.title}>{post.title}</Text>
          <Text style={s.author}>by {post.user.full_name}</Text>

          {post.tags?.length > 0 && (
            <View style={s.tagsRow}>
              {post.tags.map((t) => <Text key={t} style={s.tag}>#{t}</Text>)}
            </View>
          )}

          <Text style={s.content}>{post.content}</Text>

          {post.images?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imagesRow}>
              {post.images.map((url) => <Image key={url} source={{ uri: url }} style={s.postImage} />)}
            </ScrollView>
          )}

          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#c62828' : '#666'} />
              <Text style={s.actionText}>{likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => commentRef.current?.focus()}>
              <Ionicons name="chatbubble-outline" size={18} color="#666" />
              <Text style={s.actionText}>{totalComments}</Text>
            </TouchableOpacity>
            {isOwner && (
              <View style={s.actionBtn}>
                <Ionicons name="eye-outline" size={18} color="#666" />
                <Text style={s.actionText}>{post.views_count}</Text>
              </View>
            )}
            {(isOwner || user?.is_staff) && (
              <TouchableOpacity style={s.actionBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="#c62828" />
                <Text style={[s.actionText, { color: '#c62828' }]}>Delete</Text>
              </TouchableOpacity>
            )}
            {!isOwner && (
              <TouchableOpacity style={s.actionBtn} onPress={() => { setReportTarget({ type: 'post', id: postId }); setShowReport(true); }}>
                <Ionicons name="flag-outline" size={18} color="#e65100" />
                <Text style={[s.actionText, { color: '#e65100' }]}>Report</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.commentsSection}>
          <Text style={s.commentsTitle}>Comments ({totalComments})</Text>
          {comments.length === 0 && <Text style={s.emptyComments}>No comments yet. Be the first!</Text>}
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} postId={postId} comments={comments} setComments={setComments} depth={0}
              onReport={(id) => { setReportTarget({ type: 'comment', id }); setShowReport(true); }} />
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={s.commentInput}>
        <TextInput
          ref={commentRef}
          style={s.commentTextInput}
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          onSubmitEditing={handleComment}
        />
        <TouchableOpacity style={s.sendBtn} onPress={handleComment} disabled={commenting}>
          {commenting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      {reportTarget && (
        <ReportModal
          visible={showReport}
          contentType={reportTarget.type}
          contentId={reportTarget.id}
          onClose={() => { setShowReport(false); setReportTarget(null); }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function CommentItem({
  comment: c, postId, comments, setComments, depth, replyToName, onReport,
}: {
  comment: Comment; postId: number; comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>; depth: number; replyToName?: string;
  onReport?: (id: number) => void;
}) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);

  const mention = c.content?.match(/^@\[(.+?)\]\s?/)?.[1] || (depth > 0 ? replyToName : undefined);
  const displayContent = c.content?.replace(/^@\[.+?\]\s?/, '') || '';

  const handleReply = async () => {
    if (!replyText.trim()) return;
    const raw = replyText.trim();
    const content = depth > 0 ? `@[${c.user.full_name}] ${raw}` : raw;
    try {
      setSending(true);
      const parentId = c.parent ?? c.id;
      const res = await api.post('/api/forum/comments/', { post: postId, content, parent: parentId });
      setComments((prev) => addReply(prev, parentId, res.data));
      setReplyText('');
      setReplyOpen(false);
      setRepliesVisible(true);
    } catch {} finally { setSending(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/forum/comments/${c.id}/`);
      setComments((prev) => removeComment(prev, c.id));
    } catch {}
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/api/forum/comments/${c.id}/like/`);
      setComments((prev) => updateCommentLike(prev, c.id, res.data.likes_count));
    } catch {}
  };

  return (
    <View style={[s2.comment, depth > 0 && s2.reply]}>
      <View style={s2.header}>
        <Text style={s2.userName}>{c.user.full_name}</Text>
        {mention && <Text style={s2.replyTo}>replied to {mention}</Text>}
        <Text style={s2.time}>{new Date(c.created_at).toLocaleDateString()}</Text>
      </View>

      {displayContent && displayContent !== '(image)' && <Text style={s2.text}>{displayContent}</Text>}
      {c.image && <Image source={{ uri: c.image }} style={s2.image} />}

      <View style={s2.actions}>
        <TouchableOpacity style={s2.actionBtn} onPress={handleLike}>
          <Ionicons name="heart-outline" size={14} color="#888" />
          <Text style={s2.actionText}>{c.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReplyOpen(!replyOpen)}>
          <Text style={s2.replyBtn}>Reply</Text>
        </TouchableOpacity>
        {(c.user.id === user?.id || user?.is_staff) && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="close" size={14} color="#c62828" />
          </TouchableOpacity>
        )}
        {c.user.id !== user?.id && onReport && (
          <TouchableOpacity onPress={() => onReport(c.id)}>
            <Ionicons name="flag-outline" size={13} color="#e65100" />
          </TouchableOpacity>
        )}
      </View>

      {replyOpen && (
        <View style={s2.replyInput}>
          <TextInput
            style={s2.replyTextInput}
            placeholder={`Reply to ${c.user.full_name}...`}
            placeholderTextColor="#999"
            value={replyText}
            onChangeText={setReplyText}
            onSubmitEditing={handleReply}
          />
          <TouchableOpacity style={s2.replySend} onPress={handleReply} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color="#800000" /> : <Ionicons name="send" size={14} color="#800000" />}
          </TouchableOpacity>
        </View>
      )}

      {c.replies?.length > 0 && depth === 0 && (
        <TouchableOpacity onPress={() => setRepliesVisible(!repliesVisible)}>
          <Text style={s2.toggleReplies}>
            {repliesVisible ? '▾' : '▸'} {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
          </Text>
        </TouchableOpacity>
      )}

      {c.replies?.length > 0 && (depth > 0 || repliesVisible) && (
        <View style={s2.repliesList}>
          {c.replies.map((r) => (
            <CommentItem key={r.id} comment={r} postId={postId} comments={comments}
              setComments={setComments} depth={depth + 1} replyToName={c.user.full_name} onReport={onReport} />
          ))}
        </View>
      )}
    </View>
  );
}

// Nested state helpers
function removeComment(comments: Comment[], id: number): Comment[] {
  return comments.filter((c) => c.id !== id).map((c) => ({
    ...c, replies: c.replies ? removeComment(c.replies, id) : [],
  }));
}

function updateCommentLike(comments: Comment[], id: number, count: number): Comment[] {
  return comments.map((c) => ({
    ...c,
    likes_count: c.id === id ? count : c.likes_count,
    replies: c.replies ? updateCommentLike(c.replies, id, count) : [],
  }));
}

function addReply(comments: Comment[], parentId: number, reply: Comment): Comment[] {
  return comments.map((c) =>
    c.id === parentId
      ? { ...c, replies: [...(c.replies || []), reply] }
      : { ...c, replies: c.replies ? addReply(c.replies, parentId, reply) : [] }
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  postCard: { backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 18, elevation: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { backgroundColor: '#f0f0f0', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  catText: { fontSize: 11, fontWeight: '600', color: '#555' },
  date: { fontSize: 12, color: '#999' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  author: { fontSize: 13, color: '#888', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: { fontSize: 13, color: '#800000' },
  content: { fontSize: 16, color: '#333', lineHeight: 24 },
  imagesRow: { marginTop: 12 },
  postImage: { width: 200, height: 150, borderRadius: 10, marginRight: 8 },
  actionsRow: { flexDirection: 'row', gap: 20, marginTop: 16, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#eee' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 15, color: '#666', fontWeight: '500' },
  commentsSection: { paddingHorizontal: 12, marginTop: 4 },
  commentsTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyComments: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 10 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  commentTextInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#333' },
  sendBtn: { backgroundColor: '#800000', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

const s2 = StyleSheet.create({
  comment: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  reply: { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: '#e0e0e0', paddingLeft: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontWeight: '600', fontSize: 14, color: '#333' },
  replyTo: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  time: { fontSize: 11, color: '#bbb' },
  text: { fontSize: 14, color: '#444', marginTop: 4, lineHeight: 20 },
  image: { width: 160, height: 120, borderRadius: 8, marginTop: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionText: { fontSize: 12, color: '#888' },
  replyBtn: { fontSize: 12, color: '#800000', fontWeight: '600' },
  replyInput: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  replyTextInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#333',
  },
  replySend: { padding: 6 },
  toggleReplies: { fontSize: 12, color: '#666', marginTop: 6 },
  repliesList: { marginTop: 4 },
});
