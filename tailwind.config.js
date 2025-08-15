/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
            },
            colors: {
                'brand-blue': '#20A8CE',
                'brand-cyan': '#20A8CE',
                'brand-purple': '#6F42C1',
                'light-bg': '#F8F9FA',
                'card-bg': '#FFFFFF',
                'text-primary': '#212529',
                'text-secondary': '#6C757D',
                'border-light': '#E9ECEF',
                'status-green': '#28A745',
                'status-yellow': '#FFC107',
                'status-red': '#DC3545',
            }
        }
    },
    plugins: [],
}