'use client';
import {useEffect,useState} from 'react';
type Status={configured:boolean;sent:number;pending:number};
export default function EmailNotifications(){
 const [status,setStatus]=useState<Status|null>(null);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function refresh(){try{const r=await fetch('/api/notifications',{cache:'no-store'});if(!r.ok)throw Error();setStatus(await r.json())}catch{setMessage('Email delivery status unavailable. Your saved inquiries are below.')}}
 useEffect(()=>{void refresh()},[]);
 async function retry(){setBusy(true);setMessage('');try{const r=await fetch('/api/notifications',{method:'POST'});const data=await r.json();if(!r.ok)throw Error(data.error);setMessage(`Retried ${data.retried} notification(s). Check the pending count and Gmail inbox.`);await refresh()}catch(e){setMessage(e instanceof Error?e.message:'Could not retry')}finally{setBusy(false)}}
 return <section className="admin-shell" style={{padding:'20px 24px',marginBottom:0}} aria-label="Gmail notifications"><strong>Gmail notifications</strong>{status&&<p>{status.configured?`Sending to g.18.riyas@gmail.com · ${status.sent} sent · ${status.pending} pending`:'Not connected yet. Add GMAIL_USER and GMAIL_APP_PASSWORD in Netlify and redeploy.'}</p>}{status?.configured&&status.pending>0&&<button type="button" onClick={retry} disabled={busy}>{busy?'Retrying…':'Retry next pending email'}</button>}<p role="status">{message}</p></section>
}
