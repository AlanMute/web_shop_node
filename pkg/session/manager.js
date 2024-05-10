const sessions = new Map();

function setSession(userId, user) {
    sessions.set(userId, user);
}

function getSession(userId) {
    userId = parseInt(userId, 10);
    return sessions.get(userId);
}

function deleteSession(userId) {
    userId = parseInt(userId, 10);
    sessions.delete(userId);
}

function clearSessions() {
    sessions.clear();
}

module.exports = {
    setSession,
    getSession,
    deleteSession,
    clearSessions,
};
