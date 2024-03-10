npx := env("npx", "bun")

start: kill tailwind-watch-pm2 parcel-pm2
    # xdg-open http://localhost:1234
    
# tailwind watch (managed by pm2)
tailwind-watch-pm2:
    {{npx}} pm2 start --name "tailwind watch" 'tailwindcss -i ./src/static/css/main.tailwind.css -o ./src/static/css/main.css --watch --minify'

# tailwind build
tailwind-build:
    {{npx}} tailwindcss -i ./src/static/css/main.tailwind.css -o ./src/static/css/main.css --minify

# parcel watch (managed by pm2)
parcel-pm2: parcel-clean-build
    {{npx}} pm2 start --name "parcel watch" 'parcel "src/**/*.html"'

# clean
parcel-clean-build:
    rm -rf dist .parcel-cache

# parcel build
parcel-build: parcel-clean-build
    {{npx}} parcel build --public-url '.' 'src/**/*.html'

# build the application
build: tailwind-build parcel-build

# show pm2 logs
logs:
    {{npx}} pm2 logs

# kill all pm2 background applications
kill:
    {{npx}} pm2 kill

# eslint
eslint:
    {{npx}} eslint .

# clean
clean: parcel-clean-build
