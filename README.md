# blog-like-btn

like button implementation of [my blog](https://github.com/waynezhang/blog)

## Setup

1. [Setup](https://firebase.google.com/docs/functions/get-started) Firebase
1. [Bind](https://firebase.google.com/docs/hosting/custom-domain) your domain if necessary
1. Alter `public/javascript/widget.js` to change hosting domain

    ```javascript
    getServer() {
      return 'https://like.lhzhang.com' // change this url to your firebase app url
    }
    ```
    
1. Alter `functions/index.js` to config cors

    ```javascript
    const whitelist = [ 'http://lhzhang.com' ] // change this domain to your blog domain
    ```
    
1. Add scripts to your blog post

    ```html
    <span
        class           = "like-wrapper"
        like-shortname  = '{{ site.disqus }}'  <!-- required. any string works -->
        like-identifier = '{{ page.guid }}'  <!-- identifier of this post, uuid prefered -->
        like-name       = '{{ page.title }}'  <!-- post title -->
        like-btn        = '&#xf087;'  <!-- text for like button -->
        like-link       = '{{ site.atom-baseurl }}{{ page.url }}'  <!-- post link -->
    >
    </span>
    <script type="text/javascript">
      var l = document.createElement('script');
      l.type = 'text/javascript'; l.async = true; l.src = 'http://like.lhzhang.com/javascript/widget.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(l);
    </script>
    ```
    
1. Deploy

    ```bash
    $ firebase deploy
    ```
