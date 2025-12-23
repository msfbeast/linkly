import { toast } from 'sonner';

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

export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
    try {
        const response = await fetch('/api/create-razorpay-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount, // sending raw amount, backend multiplies by 100 if needed? 
                // Wait, checking api/create-razorpay-order.ts: it does amount * 100.
                // So we send standard units (e.g. 299).
                currency,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

export const createRazorpaySubscription = async (planId: string, notes: any) => {
    try {
        const response = await fetch('/api/create-razorpay-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planId,
                total_count: 120, // 10 years
                notes
            }),
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

export const verifyRazorpayPayment = async (paymentData: any) => {
    try {
        const response = await fetch('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment verification failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};
