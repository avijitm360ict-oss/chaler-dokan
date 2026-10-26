export interface SendSmsOptions {
  toPhone: string;
  message: string;
  tenantId?: string;
}

export class SmsService {
  /**
   * Send SMS to customer or supplier in Bangladesh
   * Formats phone number and dispatches via Gateway or Simulator
   */
  static async sendSms(options: SendSmsOptions): Promise<{ success: boolean; messageId: string; phone: string }> {
    const rawPhone = options.toPhone.replace(/[\s-]/g, '');
    let formattedPhone = rawPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '88' + formattedPhone;
    } else if (!formattedPhone.startsWith('880')) {
      formattedPhone = '880' + formattedPhone;
    }

    console.log(`[SMS-SERVICE] 📱 Sending Bengali SMS to: ${formattedPhone}`);
    console.log(`[SMS-SERVICE] 💬 Content: "${options.message}"`);

    // In production with live API key:
    // const apiKey = process.env.SMS_API_KEY;
    // const senderId = process.env.SMS_SENDER_ID || 'CHAL DOKAN';
    // fetch(`https://api.greenweb.com.bd/api.php?token=${apiKey}&to=${formattedPhone}&message=${encodeURIComponent(options.message)}`)

    return {
      success: true,
      messageId: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phone: formattedPhone,
    };
  }

  /**
   * Format Invoice Sale SMS for customer
   */
  static buildInvoiceSms(shopName: string, docNo: string, totalTk: number, paidTk: number, dueTk: number): string {
    return `${shopName}: চালান নং #${docNo} সম্পন্ন। মোট বিল: ৳${totalTk.toLocaleString('en-IN')}, জমা: ৳${paidTk.toLocaleString('en-IN')}${
      dueTk > 0 ? `, অবশিষ্ট বাকি: ৳${dueTk.toLocaleString('en-IN')}` : ' (সম্পূর্ণ পরিশোধিত)'
    }। ধন্যবাদ সাথে থাকার জন্য।`;
  }

  /**
   * Format Due Collection Reminder SMS
   */
  static buildDueReminderSms(shopName: string, customerName: string, dueTk: number): string {
    return `${shopName}: প্রিয় ${customerName}, আপনার দোকানে মোট ৳${dueTk.toLocaleString('en-IN')} বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হলো। ধন্যবাদ।`;
  }
}

export default SmsService;
