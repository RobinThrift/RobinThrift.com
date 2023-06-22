+++
title = "Persistent Colour Scheme Changes in Neovim"
date = 2023-06-22T12:00:00+01:00
tags = [ "neovim", "alacritty" ]
+++

If you're too lazy to read how and why, you can skip straight to the [solution](#tldr-just-give-me-the-solution).

Say, you're like me—you have more than one colour scheme in your rotation. Perhaps your desk is situated next to a
beautiful window that bathes your workspace in ever-changing natural light throughout the day, especially in the summer.
This, of course, leads to the necessity of frequently having to switch colour schemes.
Thankfully(?), the clever folks behind [telescope](https://github.com/nvim-telescope/telescope.nvim) have made it incredibly
easy to find and switch between installed colour schemes.

Well, I am kind of lazy sometimes, so the mere thought of making the arduous trek to my Neovim config every time I desired
a change in scenery seemed quite burdensome.

If you're using Neovim ~~correctly~~ *traditionally* you will be quitting and opening Neovim many times
a day and find that settings that are not in your config files do not persist.
Generally I find this behavior useful because it allows for specific config values in specific situations, without
Neovim messing with my meticulously crafted Lua-based config.
**I** however can mess with config as much as I like, so I will.

Now, what follows is an incredibly terrible, hacky, and downright awful way to address this issue, but hey, it works (on my machine).


## Setup

I use [lazy.nvim](https://github.com/folke/lazy.nvim) for plugin management so this will focus on that, the general concept however is independent of any
specific plugin system.

Assuming a structure similar to the following in your Neovim config directory (e.g., `~/.config/nvim`):
```
.
├── init.lua # <- lazy setup
└── lua
    ├── config # <- regular neovim config
    │   ├── ...
    │   └── ...
    └── plugins # <- cool kids plugins
        ├── ...
        ├── colours.lua # <- this is where the colours are
        └── ...
```

Any file/directory we create in the `lua` directory should be loadable by Neovim (if you've set the path accordingly).
I named the directory `_colour` to indicate that this is not normal, hacky and should not actyally ever be used. But here we are,
so let's also create an apporiate `init.lua` file in this hideaus directory.
```lua
-- file: lua/_colour/init.lua
local M = {}

local set_colourscheme = require("_colour.colourscheme")

M.setup = function ()
    set_colourscheme()
end

return M
```

When requiring a Lua module (read directory) the runtime will automatically load the `init.lua` inside it. `lazy.nvim` knows how to load modules
and will automatically call any `setup` function in the table we return. This is the minimum amount of boilerplate to integrate with `lazy.nvim`.

The magic here is the `require("_colour.colourscheme")` which tells the Lua runtime to load `lua/_colour/colourscheme.lua` which is a minimal file that looks like this:
```lua
-- file: lua/_colour/colourscheme.lua
return function ()
    vim.cmd [[colorscheme terafox]]
end
```

Splitting this into two files might seem like a questionable decision at first, but there's a (good?) reason for this I'll cover in the next section.

For now let's hook up this "plugin" to `lazy.nvim`. I have all my colour scheme plugins in a file `lua/pugins/colors.lua` (as shown above) which looks something like this:
```lua
return {
    { "EdenEast/nightfox.nvim", priority=1000 },
    -- all your cool colour schemes here
    {
        dir="~/.config/nvim/lua/_colour",
        lazy=false,
        priority=900,
        init = function ()
            require("_colour").setup()
        end
    },
}
```

The important bit is the last entry that tells `lazy.nvim` to load our plugin from the given directory (executing the `init.lua`). We have to specify the plugin to not be lazy (`lazy=false`)
and set the `priority` to be lower thatn those of the colour schemes (setting the `priority` is recommended by lazy). 
Lazy will call the `init` function on startup. In this case we just call our `setup` function we defined in `lua/_colour/init.lua`.
This is all the setup we need here.


## Autocmds

Vim's *(automatic commands)(https://vimhelp.org/autocmd.txt.html)* (or *autocmd*, see `:help autocmd`) are a super cool feature I don't use often enough.
It's basically an event system that allows you to attach callbacks to all sorts of events, opening files, writing, etc., and of course, most importantly
the [`ColorScheme`](https://vimhelp.org/autocmd.txt.html#ColorScheme) event which is triggered whenever the colour scheme was **successfully** changed.
We can add this to our `setup` function as follows:

```lua
-- file: lua/_colour/init.lua
local M = {}

local set_colourscheme = require("_colour.colourscheme")

M.setup = function ()
    set_colourscheme()

    vim.api.nvim_create_autocmd('ColorScheme', {
        callback = function(args)
            -- args.match is the name of the colour scheme
        end,
    })
end

return M
```

So now we have a way to hook into the system..>


## Commence the Hackery

I'm no Lua expert, and when faced with the possibility of a world-ending catastrophe, I wasn't about to waste time mastering file operations in Lua.
I took the lazy way out, shamelessly exploiting Lua's built-int file loading mechanism (`require`) and relying on some ~~clever~~ unix hackery to do the job.

All we really needed was to tweak a single section of the configuration to ensure the color scheme sticks around.
It's a distinctive and conveniently identifiable pattern, just begging to be manipulated with a touch of `sed` magic.
```bash
$ sed -i '' -e 's/\[\[colorscheme .*\]\]/[[colorscheme terafox]]/' ~/.config/nvim/lua/_colour/colourscheme.lua
```
> NOTE: This is the BSD version of `sed`, the flags for the GNU version are slightly different, especially for the `-i` flag IIRC.

Let's hook this up to the autocmd:
```lua
vim.api.nvim_create_autocmd('ColorScheme', {
    callback = function(args)
        vim.fn.jobstart("sed -i '' -e 's/\\[\\[colorscheme .*\\]\\]/[[colorscheme " .. args.match .. "]]/' ~/.config/nvim/lua/_colour/colourscheme.lua")
    end,
})
```
> NOTE: Check out [`:help jobstart`](https://neovim.io/doc/user/builtin.html#jobstart()) for more info.

Now we get back to why I split the actual vim command to set the colour scheme and the "plugin" into two files.
I figured it would be wiser to tinker with a file that contains minimal content, rather than having the file executing the command
end up modifying itself. That's just asking for trouble.

And that's kind of it. Now every time the colour scheme is changed `lua/_colour/colourscheme.lua` is updated with the new name. Nifty.

And if you're an [alacritty](https://github.com/alacritty/alacritty) user who craves harmony between the two, continue reading onto the [bonus section](#bonus-alacritty) for some extra snazz.

## TL;DR Just Give Me the Solution

Here's the full solution:

```lua
-- file: lua/_colour/init.lua
local M = {}

local set_colourscheme = require("_colour.colourscheme")

M.setup = function ()
    set_colourscheme()

    vim.api.nvim_create_autocmd('ColorScheme', {
        callback = function(args)
            vim.fn.jobstart("sed -i '' -e 's/\\[\\[colorscheme .*\\]\\]/[[colorscheme " .. args.match .. "]]/' ~/.config/nvim/lua/_colour/colourscheme.lua")
            -- see bonus section for more info
            -- vim.fn.jobstart("bash -c 'source location_of_functions_file && set_alactritty_color " .. args.match .. "'")
        end,
    })
end

return M
```

```lua
-- file: lua/_colour/colourscheme.lua
return function ()
    vim.cmd [[colorscheme terafox]]
end
```

```lua
-- file: lua/plugins/colours.lua
return {
    { "EdenEast/nightfox.nvim", priority=1000 },
    -- all your cool colour schemes here
    {
        dir="~/.config/nvim/lua/_colour",
        lazy=false,
        priority=900,
        init = function ()
            require("_colour").setup()
        end
    },
}
```

## Bonus: Alacritty

This entire thing actually started as way to change the alacritty theme with a simple command. This section right here represents that original idea.
A bit of background: alacritty is configured using a YAML file, e.g. at `~/.config/alacritty/alacritty.yaml`
In that file, you have the ability to define various colour schemes under the `schemes` field without actually activating them.
```yaml
schemes:
  nightfox: &nightfox
    primary:
      background: '0x192330'
      foreground: '0xcdcecf'
    normal:
      black:   '0x393b44'
      red:     '0xc94f6d'
      green:   '0x81b29a'
      yellow:  '0xdbc074'
      blue:    '0x719cd6'
      magenta: '0x9d79d6'
      cyan:    '0x63cdcf'
      white:   '0xdfdfe0'
    bright:
      black:   '0x575860'
      red:     '0xd16983'
      green:   '0x8ebaa4'
      yellow:  '0xe0c989'
      blue:    '0x86abdc'
      magenta: '0xbaa1e2'
      cyan:    '0x7ad5d6'
      white:   '0xe4e4e6'
    indexed_colors:
      - { index: 16, color: '0xf4a261' }
      - { index: 17, color: '0xd67ad2' }

colors: *nightfox
```

The `&nightfox` is called an [`anchor`](https://yaml.org/spec/1.2.2/#rule-c-anchor) in YAML and allows you to reference a object somewhere else
in the document using a alias, here this would be `*nightfox`.
So we can actually have many schemas in our alacritty config with only one being active by just changing the alias that `colors` uses.

So you'd think we can just do the same as above with `sed`:
```bash
$ sed -i '' -e "s/^colors:.*/colors: *new_scheme_alias/"  ~.config/alacritty/alacritty.yml
```

However, not all schemes are available for alacritty and having incorrect config is very annoying (and also ugly) so I wrapped the call with a little
bash script that ensures the scheme is actually defined before setting it.
```bash
function set_alactritty_color() {
    local config_file="$HOME/.config/alacritty/alacritty.yml"
    local found=$(grep "$1" "$config_file")
    if [ "$found" ]; then
        sed -i '' -e "s/^colors:.*/colors: *$1/"  "$config_file"
    fi;
}
```

I put this into a file that is always sourced when I start a bash, so the `set_alactritty_color` function is always available to me.
I also hooked this up to the autocmd that persists the Neovim colour scheme.
```lua
vim.api.nvim_create_autocmd('ColorScheme', {
    callback = function(args)
        vim.fn.jobstart("sed -i '' -e 's/\\[\\[colorscheme .*\\]\\]/[[colorscheme " .. args.match .. "]]/' ~/.config/nvim/lua/_colour/colourscheme.lua")
        -- change the source argument to whever the file you added the function too
        vim.fn.jobstart("bash -c 'source location_of_functions_file && set_alactritty_color " .. args.match .. "'")
    end,
})
```

And there you have it, the "brilliant" and somewhat cursed way to persist a dynamically set Neovim scheme and sync it with alacritty, if possible.

If you have any recommendations for improvements let me know, although now that it's working, I'll probably ignore them.
