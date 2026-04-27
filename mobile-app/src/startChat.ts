import api from './api';

/**
 * Start (or resume) a chat with another user.
 * Looks for an existing conversation between the two users; if found, navigates to it.
 * If not found, creates a new conversation with a default greeting and navigates to it.
 */
export async function startChatWithUser(
  navigation: any,
  targetUser: { id: number; full_name: string },
  source?: string,
) {
  try {
    // Look for existing conversation
    const res = await api.get('/api/messaging/conversations/');
    const convs = res.data.results ?? res.data;
    const existing = convs.find(
      (c: any) => c.sender === targetUser.id || c.receiver === targetUser.id,
    );

    if (existing) {
      navigation.navigate('Messages', { screen: 'MessagesList' });
      setTimeout(() => {
        navigation.navigate('Messages', {
          screen: 'ChatDetail',
          params: { conversation: existing },
        });
      }, 100);
      return;
    }

    // Create a new conversation with a default greeting
    const greeting = source ? `Hi! Saw your ${source}.` : 'Hi!';
    const createRes = await api.post('/api/messaging/conversations/', {
      receiver: targetUser.id,
      text: greeting,
      source,
    });

    navigation.navigate('Messages', { screen: 'MessagesList' });
    setTimeout(() => {
      navigation.navigate('Messages', {
        screen: 'ChatDetail',
        params: { conversation: createRes.data },
      });
    }, 100);
  } catch (err: any) {
    console.warn('startChatWithUser failed:', err.response?.data || err.message);
  }
}
