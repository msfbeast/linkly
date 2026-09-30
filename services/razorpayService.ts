import { supabase } from './storage/supabaseClient';

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id: string;
    handler: (response: any) => void;
    prefill: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme: {
        color: string;
    };
}

export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

/** Authorization header for the current Supabase session (empty if signed out). */
export const authHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

/** The server decides the tier from the plan and ties the subscription to the signed-in user. */
export const createRazorpaySubscription = async (planId: string) => {
    try {
        const response = await fetch('/api/create-razorpay-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(await authHeaders()),
            },
            body: JSON.stringify({ planId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create subscription');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        throw error;
    }
};
