import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useTokens = (userId?: string) => {
  const [tokens, setTokens] = useState({
    permanent: 0,
    resettable: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchTokens();
  }, [userId]);

  const fetchTokens = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('user_tokens')
        .select('permanent_tokens, resettable_tokens')
        .eq('user_id', userId)
        .single();

      if (data) {
        setTokens({
          permanent: data.permanent_tokens || 0,
          resettable: data.resettable_tokens || 0,
          total: (data.permanent_tokens || 0) + (data.resettable_tokens || 0),
        });
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const consumeTokens = async (seconds: number) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      const { data, error } = await supabase.rpc('consume_tokens', {
        p_user_id: userId,
        p_seconds: seconds,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchTokens();
      }

      return data;
    } catch (error) {
      console.error('Error consuming tokens:', error);
      return { success: false, error: error.message };
    }
  };

  const purchaseTokens = async (amount: number, paymentId: string) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      const { data, error } = await supabase.rpc('purchase_tokens', {
        p_user_id: userId,
        p_amount: amount,
        p_payment_id: paymentId,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchTokens(); // Refresh local state
      }

      return data;
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    tokens,
    loading,
    consumeTokens,
    purchaseTokens,
    refetch: fetchTokens,
  };
};

export const useSubscription = (userId?: string) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = async (
    planType: string,
    stripeSubscriptionId: string,
    stripeCustomerId: string
  ) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      const { data, error } = await supabase.rpc('activate_subscription', {
        p_user_id: userId,
        p_plan_type: planType,
        p_stripe_subscription_id: stripeSubscriptionId,
        p_stripe_customer_id: stripeCustomerId,
      });

      if (error) throw error;

      if (data?.success) {
        await fetchSubscription(); // Refresh local state
      }

      return data;
    } catch (error) {
      console.error('Error activating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  const cancelSubscription = async () => {
    if (!userId || !subscription) return { success: false, error: 'No active subscription' };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('id', subscription.id);

      if (error) throw error;

      await fetchSubscription(); // Refresh local state
      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    subscription,
    loading,
    activateSubscription,
    cancelSubscription,
    refetch: fetchSubscription,
  };
}; 