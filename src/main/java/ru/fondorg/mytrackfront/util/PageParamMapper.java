package ru.fondorg.mytrackfront.util;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import ru.fondorg.mytrackfront.config.MyTrackProperties;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PageParamMapper {
    private final MyTrackProperties properties;


    public Map<String, Object> mapParams(int page, int size) {
        Map<String, Object> params = new HashMap<>(2);
        params.put("page", page == 0 ? 1 : page);
        params.put("size", size == 0 ? properties.getDefaultIssuesPageSize() : size);
        return params;
    }
}
