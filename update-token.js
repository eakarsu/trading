// Script to update JWT token in browser localStorage
// Run this in the browser console or use it as a bookmarklet

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc2NGE3NTY2LWNkY2QtNGQ0Ni1hZGRjLThlYWY4MWY1NGVkZiIsImVtYWlsIjoiYWRtaW5AdHJhZGluZy5jb20iLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzUzODA2NjQxLCJleHAiOjE3NTYzOTg2NDF9.5boFgtCAQ-11v0LJCi304iuFfBZwafbZVuy0PY5TGX0';

console.log('🔐 Setting JWT token in localStorage...');
localStorage.setItem('token', token);
console.log('✅ Token set successfully!');
console.log('🔄 Reloading page...');
window.location.reload();
