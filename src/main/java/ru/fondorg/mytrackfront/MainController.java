package ru.fondorg.mytrackfront;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;

@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080"})
@Controller
public class MainController {

    @GetMapping("/")
    public String main() {
        return "index.html";
    }
}
