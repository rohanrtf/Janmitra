import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function saveWorker(workerData) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .upsert({
        id: workerData.id || crypto.randomUUID(),
        mobile: workerData.mobile,
        aadhaar_last4: workerData.aadhaarLast4,
        name: workerData.name,
        dob: workerData.dob,
        gender: workerData.gender,
        address: workerData.address,
        pincode: workerData.pincode,
        father_name: workerData.fatherName,
        uan: workerData.uan,
        agent_id: workerData.agentId
      })
    if (error) console.error('Save worker error:', error)
    return data
  } catch (err) {
    console.error('Save worker error:', err)
  }
}

export async function loadWorkers() {
  const { data, error } = await supabase.from('workers').select('*')
  if (error) console.error('Load workers error:', error)
  return data || []
}

export async function saveApplication(workerId, schemeName, status, notes) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      id: crypto.randomUUID(),
      worker_id: workerId,
      scheme_name: schemeName,
      status: status || 'pending',
      notes: notes,
    })
  if (error) console.error('Save application error:', error)
  return data
}

export async function loadApplications(workerId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('worker_id', workerId)
  if (error) console.error('Load applications error:', error)
  return data || []
}
