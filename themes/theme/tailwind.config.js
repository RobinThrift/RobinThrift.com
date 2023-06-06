/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./layouts/**/*.html", "./layouts/*.html"],

    darkMode: "media",

    theme: {
        extend: {
            screens: {
                xl: "1000px",
                "2xl": "1000px",
            },

            container: {
                center: true,
                padding: "2rem",
            },

            fontFamily: {
                sans: ["Fixel Text", "ui-sans-serif", "system-ui"],
                mono: ["LeagueMono", "ui-monospace", "SFMono-Regular"],
            },
        },
    },

    plugins: [require("@tailwindcss/typography")],
}
