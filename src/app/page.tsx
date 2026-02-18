'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LogOut, Bookmark, Plus, Trash2, ExternalLink } from 'lucide-react';

interface BookmarkType {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks(session.user.id);
      else setBookmarks([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Realtime subscription
    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => [payload.new as BookmarkType, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchBookmarks = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching bookmarks:', error);
    else setBookmarks(data || []);
  };

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newUrl) return;

    const { error } = await supabase.from('bookmarks').insert([
      { title: newTitle, url: newUrl, user_id: user.id },
    ]);

    if (error) {
      alert('Error adding bookmark');
    } else {
      setNewTitle('');
      setNewUrl('');
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) alert('Error deleting bookmark');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-blue-900/20">
        <div className="glass p-12 rounded-3xl shadow-2xl max-w-md w-full text-center animate-fade-in">
          <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Smart Bookmark</h1>
          <p className="text-slate-400 mb-8 text-lg">Organize your favorite links in real-time with elegance.</p>
          <button
            onClick={signIn}
            className="w-full bg-white text-black font-semibold py-4 px-6 rounded-xl transition-all hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-2">
              <Bookmark className="text-primary" />
              Your Bookmarks
            </h1>
            <p className="text-slate-400">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={addBookmark} className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Title (e.g. Google Search)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className="glass p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-all animate-fade-in shadow-xl hover:shadow-primary/5"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {bookmark.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6 break-all line-clamp-2">
                  {bookmark.url}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  Visit Site
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
                  title="Delete Bookmark"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {bookmarks.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No bookmarks yet. Start by adding one above!</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
