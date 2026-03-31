import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Phaos AI"

interface LeadNotificationProps {
  source?: string
  name?: string
  title?: string
  company?: string
  website?: string
  email?: string
  phone?: string
  message?: string
}

const LeadNotificationEmail = (props: LeadNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {props.source || 'Website'} Inquiry — {props.name || props.company || 'Visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New {props.source || 'Website'} Inquiry</Heading>
        <Hr style={hr} />
        <Text style={label}>Source</Text>
        <Text style={value}>{props.source || 'Website'}</Text>
        {props.name && (<><Text style={label}>Name</Text><Text style={value}>{props.name}</Text></>)}
        {props.title && (<><Text style={label}>Title</Text><Text style={value}>{props.title}</Text></>)}
        {props.company && (<><Text style={label}>Company</Text><Text style={value}>{props.company}</Text></>)}
        {props.website && (<><Text style={label}>Website</Text><Text style={value}>{props.website}</Text></>)}
        {props.email && (<><Text style={label}>Email</Text><Text style={value}>{props.email}</Text></>)}
        {props.phone && (<><Text style={label}>Phone</Text><Text style={value}>{props.phone}</Text></>)}
        <Hr style={hr} />
        <Text style={label}>Message</Text>
        <Text style={messageStyle}>{props.message || 'No message provided'}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Captured at {new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LeadNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New ${data.source || 'Website'} Inquiry: ${data.name || data.company || 'Visitor'}`,
  to: 'daniel@phaosai.com',
  displayName: 'Lead notification',
  previewData: {
    source: 'Contact Form',
    name: 'Jane Smith',
    title: 'VP Operations',
    company: 'Acme Corp',
    website: 'https://acme.com',
    email: 'jane@acme.com',
    phone: '(555) 123-4567',
    message: 'Interested in Voice AI for our call center operations.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '24px 30px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '16px 0' }
const label = { fontSize: '11px', fontWeight: '600' as const, color: '#8A2BE2', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px' }
const value = { fontSize: '14px', color: '#1a1a2e', margin: '0 0 12px', lineHeight: '1.5' }
const messageStyle = { fontSize: '14px', color: '#333', margin: '0 0 12px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '11px', color: '#999', margin: '20px 0 0' }