<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import router from "./router";

export default {
  name: "App",
  router,
};


</script>


<style>
 @import "https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700";


body{
    font-family: 'Poppins', sans-serif;
    background: #fafafa;
}

p {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1em;
    font-weight: 300;
    line-height: 1.7em;
    color: #999;
}

a, a:hover, a:focus {
    color: inherit;
    text-decoration: none;
    transition: all 0.3s;
}

.wrapper{
        display: flex; 
        width: 100%;
}

 #sidebar{
        min-width: 250px;
        max-width: 250px;
        background-color: blueviolet;
        min-height: 100vh;
        transition: all 0.3s;
    }

#sidebar .sidebar-header{
        padding: 20px;
        background-color: burlywood;
    }


    #sidebar ul.components{
        padding: 20px 0;
        border-bottom: 1px solid #47748b; 
    }

 #sidebar ul p{
        padding: 10px;
        color: #fff;
    }

   #sidebar ul li a {
        padding: 10px; 
        font-size: 1.1em;
        display: block; 
    }

  #sidebar ul li a:hover{
        color: #737373;
        background-color: #fff;
    }

    #sidebar ul li.active > a, a[aria-expanded="true"]{
        color: #fff;
        background-color: cadetblue;
    }

    ul ul a {
        font-size: 0.9em im !important; 
        padding-left: 30px !important; 
        background: #6d7fcc;
    }

    #sidebar.active{
        margin-left: -250px; 
    }

    @media(max-width: 768px){
        #sidebar{
            margin-left: -250px;
        }
        #sidebar.active{
            margin-left: 0;
        }
    }
</style>


