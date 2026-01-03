async function checkLogin(){
    try{
        const res = await fetch("/api/auth/profile", {
            credentials: "include" //send cookies to backend
        })
        if(res.ok){
            const userData = await res.json();
            return { isLoggedIn: true, user: userData };
        }
        else{
            return { isLoggedIn: false, user: null };
        }
    }
    catch (error){
        console.error(error);
        return { isLoggedIn: false, user: null };
    }
}

async function logout(){
    try{
        const res = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include" //send cookies to backend
        })
        if(res.ok){
            // Redirect to home page after successful logout
            window.location.href = '/';
        }
        else{
            console.error("Logout failed");
        }
    }
    catch (error){
        console.error("Logout error:", error);
    }
}