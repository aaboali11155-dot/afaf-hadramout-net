import { supabase } from '../lib/supabase';

export async function signUp({ email, password, gender, acceptedOath }) {
  const redirectUrl = `${window.location.origin}/email-confirmed/`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        gender,
        accepted_oath: acceptedOath,
      },
    },
  });

  if (error) throw error;

  // لا نُنشئ profile إذا لم توجد session (يحتاج المستخدم لتأكيد البريد أولاً)
  if (data.session && data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: data.user.id,
      الجنس: gender,
      إقرار_الزواج: acceptedOath,
      account_status: 'active',
    }, { onConflict: 'user_id' });

    if (profileError) {
      throw profileError;
    }
  }

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // عند أول دخول بعد تأكيد البريد، أنشئ أو حدّث profile المستخدم الحالي
  if (data.user) {
    const gender = data.user.user_metadata?.gender;
    const acceptedOath = data.user.user_metadata?.accepted_oath;

    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id, account_status')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    // لا نغيّر حالة الحساب عند تسجيل الدخول؛ خصوصًا الحسابات الموقوفة/المحظورة.
    if (['suspended', 'blocked', 'banned'].includes(existing?.account_status)) {
      await supabase.auth.signOut();
      throw new Error('هذا الحساب موقوف ولا يمكن تسجيل الدخول به.');
    }

    if (existing) {
      const payload = {};
      if (gender !== undefined && gender !== null) {
        payload.الجنس = gender;
      }
      if (acceptedOath !== undefined && acceptedOath !== null) {
        payload.إقرار_الزواج = acceptedOath;
      }

      if (Object.keys(payload).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(payload)
          .eq('user_id', data.user.id);
        if (updateError) throw updateError;
      }
    } else {
      const payload = {
        user_id: data.user.id,
        account_status: 'active',
      };
      if (gender !== undefined && gender !== null) payload.الجنس = gender;
      if (acceptedOath !== undefined && acceptedOath !== null) payload.إقرار_الزواج = acceptedOath;

      const { error: insertError } = await supabase.from('profiles').insert(payload);
      if (insertError) throw insertError;
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
