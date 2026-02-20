import { useNotification } from '../hooks/useNotification';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import AvatarUpload from '../components/AvatarUpload';
import CreateGroupModal from '../components/CreateGroupModal';
import api from '../utils/api';
import { SERVER_URL } from '../utils/config';

const Chat = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [conversations, setConversations] = useState([]); // list of conversations
    const [selectedConversation, setSelectedConversation] = useState(null); // currently open conversation
    const [users, setUsers] = useState([]); // list of users
    const [showUsers, setShowUsers] = useState(false); // whether to show user list
    const { darkMode, toggleDarkMode } = useTheme(); // dark mode toggle
    const { sendNotification } = useNotification(); // notification hook
    const [typingUsers, setTypingUsers] = useState({}); // track typing users
    const [showGroupModal, setShowGroupModal] = useState(false); // group chat modal visibility
    const [showProfileDropdown, setShowProfileDropdown] = useState(false); // profile dropdown visibility
    const [showAvatarUpload, setShowAvatarUpload] = useState(false); // avatar upload modal visibility
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // delete account confirmation modal
    const [deleting, setDeleting] = useState(false); // delete in progress

    // fetch conversations on mount
    useEffect(() => {
        fetchConversations();  // Get all my chats
        fetchUsers(); // Get all users i can chat with
    }, [socket]); // empty dependency array to run only once

    // listen for new messages
    useEffect(() => {
        if (socket) {
            socket.on('new-message', (message) => {
                // update conversations with new message and move to top
                setConversations((prev) => {
                    const updated = prev.map((conv) => {
                        if (conv.id === message.conversationId) {
                            // Increment unread count if message is from another user
                            // and we're not currently viewing this conversation
                            const isViewing = selectedConversation?.id === conv.id;
                            const isFromOther = message.senderId !== user?.id;
                            return {
                                ...conv,
                                messages: [message],
                                unreadCount: isFromOther && !isViewing 
                                    ? (conv.unreadCount || 0) + 1 
                                    : conv.unreadCount,
                            };
                        }
                        return conv;
                    });
                    // Sort by latest message timestamp (newest first)
                    return updated.sort((a, b) => {
                        const aTime = a.messages?.[0]?.createdAt || a.createdAt;
                        const bTime = b.messages?.[0]?.createdAt || b.createdAt;
                        return new Date(bTime) - new Date(aTime);
                    });
                });

                // Send browser notification if message is from another user
                if (message.senderId !== user?.id) {
                    sendNotification(
                        `New message from ${message.sender?.username || 'Someone'}`, {
                            body: message.content,
                            tag: message.conversationId, // Prevents duplicate notifications
                        });
                }
            });

            return () => {
                socket.off('new-message'); // clean up when leaving
            };
        }
    }, [socket]);

    // Listen for online/offline status updates
            useEffect(() => {
                if (socket) {
                    socket.on('user-online', (userId) => {
                        // Update users list
                        setUsers((prev) =>
                            prev.map((u) =>
                                u.id === userId ? { ...u, isOnline: true } : u
                            )
                        );
                        // Update conversations list
                        setConversations((prev) =>
                            prev.map((conv) => ({
                                ...conv,
                                participants: conv.participants.map((p) =>
                                    p.user.id === userId
                                        ? { ...p, user: { ...p.user, isOnline: true } }
                                        : p
                                ),
                            }))
                        );
                    });

                    socket.on('user-offline', (userId) => {
                        // Update users list
                        setUsers((prev) =>
                            prev.map((u) =>
                                u.id === userId ? { ...u, isOnline: false } : u
                            )
                        );
                        // Update conversations list
                        setConversations((prev) =>
                            prev.map((conv) => ({
                                ...conv,
                                participants: conv.participants.map((p) =>
                                    p.user.id === userId
                                        ? { ...p, user: { ...p.user, isOnline: false } }
                                        : p
                                ),
                            }))
                        );
                    });

                    return () => {
                        socket.off('user-online');
                        socket.off('user-offline');
                    };
                }
            }, [socket]);

    // Listen for avatar updates
            useEffect(() => {
                if (socket) {
                    socket.on('user-avatar-updated', (data) => {
                        const { userId, avatarUrl } = data;
                        
                        // Update users list
                        setUsers((prev) =>
                            prev.map((u) =>
                                u.id === userId ? { ...u, avatarUrl } : u
                            )
                        );
                        
                        // Update conversations list
                        setConversations((prev) =>
                            prev.map((conv) => ({
                                ...conv,
                                participants: conv.participants.map((p) =>
                                    p.user.id === userId
                                        ? { ...p, user: { ...p.user, avatarUrl } }
                                        : p
                                ),
                            }))
                        );
                    });

                    return () => {
                        socket.off('user-avatar-updated');
                    };
                }
            }, [socket]);

    // Listen for typing indicators globally (for sidebar updates)
    useEffect(() => {
        if (socket) {
            socket.on('user-typing', ({ conversationId, userId }) => {
                setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
            });

            socket.on('user-stop-typing', ({ conversationId }) => {
                setTypingUsers((prev) => {
                    const updated = { ...prev };
                    delete updated[conversationId];
                    return updated;
                });
            });

            return () => {
                socket.off('user-typing');
                socket.off('user-stop-typing');
            };
        }
    }, [socket]);


    // Get all my chats from the server
    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations'); // corrected endpoint
            // Sort by latest message timestamp (newest first)
            const sorted = res.data.sort((a, b) => {
                const aTime = a.messages?.[0]?.createdAt || a.createdAt;
                const bTime = b.messages?.[0]?.createdAt || b.createdAt;
                return new Date(bTime) - new Date(aTime);
            });
            setConversations(sorted);

            // Join all conversation rooms to receive real-time updates
            if (socket) {
                res.data.forEach((conv) => {
                    socket.emit('join-conversation', conv.id);
                });
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    };

    // Get all users I can chat with
    const fetchUsers = async () => {
        try {
            const res = await api.get('/chat/users'); // corrected endpoint
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    // Start a new chat with this person
    const startConversation = async (participantId) => {
        try {
            const res = await api.post('/chat/conversations', { participantId });
            setSelectedConversation(res.data); // open new chat
            setShowUsers(false); // close user list
            fetchConversations(); // refresh chat list
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    };

    // Create a new group chat
    const createGroupChat = async (name, participantIds) => {
        try {
            const res = await api.post('/chat/conversations/group', { name, participantIds });
            setSelectedConversation(res.data); // open new group chat
            setShowGroupModal(false); // close group modal
            fetchConversations(); // refresh chat list
        } catch (err) {
            console.error('Failed to create group chat:', err);
        }
    }

                // Leave a group
            const leaveGroup = async (conversationId) => {
                if (!confirm('Are you sure you want to leave this group?')) return;
                
                try {
                    await api.delete(`/chat/conversations/${conversationId}/leave`);
                    setSelectedConversation(null);
                    fetchConversations(); // Refresh list
                } catch (err) {
                    console.error('Failed to leave group:', err);
                }
            };

    // Delete account
    const deleteAccount = async () => {
        setDeleting(true);
        try {
            await api.delete('/auth/delete');
            logout(); // This will clear token and redirect to login
        } catch (err) {
            console.error('Failed to delete account:', err);
            alert('Failed to delete account. Please try again.');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Render
    return (
        <div className='h-screen flex flex-col bg-white dark:bg-gray-900'>
            <header className='bg-blue-500 text-white p-4 flex justify-between items-center'>
                <h1 className='text-2xl font-bold'>i-ONGEA</h1>
                <div className='flex items-center gap-4'>
                    <button
                        onClick={toggleDarkMode}
                        className='p-2 rounded-lg bg-white/20 hover:bg-white/30'
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {/* Profile Dropdown */}
                    <div className='relative'>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className='flex items-center gap-2 hover:bg-white/20 rounded-lg p-1 transition-colors'
                        >
                            {user?.avatarUrl ? (
                                <img 
                                    src={`${SERVER_URL}${user.avatarUrl}`}
                                    alt={user.username}
                                    className='w-10 h-10 rounded-full object-cover border-2 border-white'
                                />
                            ) : (
                                <div className='w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-lg font-bold border-2 border-white'>
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className='hidden sm:inline'>{user?.username}</span>
                            <svg className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileDropdown && (
                            <>
                                {/* Backdrop to close dropdown when clicking outside */}
                                <div 
                                    className='fixed inset-0 z-10' 
                                    onClick={() => setShowProfileDropdown(false)}
                                />
                                <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-20 border dark:border-gray-700'>
                                    <div className='px-4 py-2 border-b dark:border-gray-700'>
                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>{user?.username}</p>
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAvatarUpload(true);
                                            setShowProfileDropdown(false);
                                        }}
                                        className='w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                                    >
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileDropdown(false);
                                            toggleDarkMode();
                                        }}
                                        className='w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                                    >
                                        {darkMode ? (
                                            <>
                                                <span>☀️</span> Light Mode
                                            </>
                                        ) : (
                                            <>
                                                <span>🌙</span> Dark Mode
                                            </>
                                        )}
                                    </button>
                                    <hr className='my-2 dark:border-gray-700' />
                                    <button
                                        onClick={() => {
                                            setShowProfileDropdown(false);
                                            logout();
                                        }}
                                        className='w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                                    >
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                                        </svg>
                                        Logout
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileDropdown(false);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className='w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2'
                                    >
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                        </svg>
                                        Delete Account
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className='flex flex-1 overflow-hidden'>
                <Sidebar 
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={(conv) => {
                        setSelectedConversation(conv);
                        // Clear unread count for this conversation
                        setConversations((prev) =>
                            prev.map((c) =>
                                c.id === conv.id ? { ...c, unreadCount: 0 } : c
                            )
                        );
                    }}
                    users={users}
                    showUsers={showUsers}
                    setShowUsers={setShowUsers}
                    onStartConversation={startConversation}
                    currentUserId={user?.id}  
                    typingUsers={typingUsers} 
                    onCreateGroup={() => setShowGroupModal(true)}             
                />

                <ChatWindow 
                    conversation={selectedConversation}
                    currentUserId={user?.id}
                    onLeaveGroup={() => leaveGroup(selectedConversation?.id)}
                />

                {/* Group Chat Creation Modal */}
                {showGroupModal && (
                    <CreateGroupModal 
                        users={users}
                        onCreate={createGroupChat}
                        onClose={() => setShowGroupModal(false)}
                    />
                )}

                {/* Avatar Upload Modal */}
                {showAvatarUpload && (
                    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90%]'>
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className='text-xl font-bold dark:text-white'>Update Profile Picture</h2>
                                <button 
                                    onClick={() => setShowAvatarUpload(false)}
                                    className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                >
                                    ✕
                                </button>
                            </div>
                            <AvatarUpload 
                                currentAvatar={user?.avatarUrl}
                                onAvatarUpdate={(newUrl) => {
                                    setShowAvatarUpload(false);
                                    window.location.reload();
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Delete Account Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90%]'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center'>
                                    <svg className='w-6 h-6 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                    </svg>
                                </div>
                                <h2 className='text-xl font-bold text-red-600 dark:text-red-400'>Delete Account</h2>
                            </div>
                            <p className='text-gray-600 dark:text-gray-300 mb-2'>
                                Are you sure you want to delete your account?
                            </p>
                            <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                                This action cannot be undone. All your messages, conversations, and data will be permanently deleted.
                            </p>
                            <div className='flex gap-3'>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteAccount}
                                    disabled={deleting}
                                    className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                                >
                                    {deleting ? (
                                        <>
                                            <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Account'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;