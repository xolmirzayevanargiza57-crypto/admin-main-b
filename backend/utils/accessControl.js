function isSubscriptionActive(subscription = {}, now = new Date()) {
    if (!subscription) return false;
    if (subscription.type === 'none') return false;
    if (subscription.status !== 'active') return false;

    if (!subscription.endDate) return true;

    return new Date(subscription.endDate) >= now;
}

function canAccessAccount(user, now = new Date()) {
    if (!user) return false;
    if (user.status !== 'active') return false;
    if (user.role === 'admin_main') return true;

    return isSubscriptionActive(user.subscription || {}, now);
}

module.exports = {
    isSubscriptionActive,
    canAccessAccount
};
