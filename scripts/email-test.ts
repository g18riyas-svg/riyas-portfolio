import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BlobsServer} from '@netlify/blobs/server';
import {setEnvironmentContext} from '@netlify/blobs';
import {notifyInquiry,emailConfigured,emailMessage} from '../lib/inquiry-email';
import {store} from '../lib/storage';
import type {Inquiry} from '../lib/inquiries';
const directory=await mkdtemp(join(tmpdir(),'riyas-email-test-'));
const server=new BlobsServer({directory,token:'test'});const {port}=await server.start();
setEnvironmentContext({siteID:'email-tests',token:'test',edgeURL:`http://127.0.0.1:${port}`,uncachedEdgeURL:`http://127.0.0.1:${port}`});
const inquiry:Inquiry={id:crypto.randomUUID(),name:'Client <test>',email:'client@example.com',project_type:'Web application',budget:'Prefer to discuss',timeline:'Flexible / exploring',message:'My project details\n<script>text only</script>',status:'new',notes:'Private notes never sent',created_at:Date.now(),updated_at:Date.now()};
try{
 process.env.GMAIL_USER='g.18.riyas@gmail.com';delete process.env.GMAIL_APP_PASSWORD;assert.equal(emailConfigured(),false);
 let calls=0;await notifyInquiry(inquiry,async()=>{calls++});assert.equal(calls,0);
 process.env.GMAIL_APP_PASSWORD='dummy-never-sent';assert.equal(emailConfigured(),true);
 const message=emailMessage(inquiry);assert.equal(message.to,'g.18.riyas@gmail.com');assert.equal(message.replyTo.address,'client@example.com');assert.match(message.text,/My project details/);assert.doesNotMatch(message.text,/Private notes/);assert.equal('html' in message,false);
 await notifyInquiry(inquiry,async()=>{calls++});assert.equal(calls,1);
 await notifyInquiry(inquiry,async()=>{calls++});assert.equal(calls,1);assert.equal((await store('notifications').get(inquiry.id,{type:'json'})).status,'sent');
 const failed={...inquiry,id:crypto.randomUUID()};await notifyInquiry(failed,async()=>{throw Error('Test SMTP failure')});assert.equal((await store('notifications').get(failed.id,{type:'json'})).status,'failed');
 await notifyInquiry(failed,async()=>{calls++});assert.equal((await store('notifications').get(failed.id,{type:'json'})).status,'sent');
 console.log('PASS: missing configuration, safe email format, fixed recipient, client Reply-To, no private notes, duplicate suppression, SMTP failure recording, retry success. No real email sent.');
}finally{await server.stop();await rm(directory,{recursive:true,force:true});}
