import { load } from '@cashfreepayments/cashfree-js';

// Initialize the Cashfree SDK
let cashfree: any = null;

export const initializeCashfree = async () => {
    if (cashfree) return cashfree;

    cashfree = await load({
        mode: import.meta.env.PROD ? 'production' : 'sandbox'
    });
    return cashfree;
};

export interface CreateOrderParams {
    amount: number;
    customerId: string;
    customerPhone: string;
    customerName: string;
}

export const createOrder = async (params: CreateOrderParams) => {
    try {
        const response = await fetch('/api/create-cashfree-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderAmount: params.amount,
                customerId: params.customerId,
                customerPhone: params.customerPhone,
                customerName: params.customerName,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
        }

        const data = await response.json();
        return data; // Returns the payment_session_id and other order details
    } catch (error) {
        console.error('Error creating Cashfree order:', error);
        throw error;
    }
};

export const startPayment = async (paymentSessionId: string) => {
    const cf = await initializeCashfree();

    // Using 'drop' mode for default popup checkout, or 'seamless' if you implement your own UI
    // For easiest integration, we start with 'drop' (checkout)
    // Actually, cashfree-js 'checkout' method opens the payment page
    return cf.checkout({
        paymentSessionId,
        returnUrl: window.location.origin + '/payment/success?order_id={order_id}',
        redirectTarget: '_self', // or '_blank', or container ID for seamless
    });
};
