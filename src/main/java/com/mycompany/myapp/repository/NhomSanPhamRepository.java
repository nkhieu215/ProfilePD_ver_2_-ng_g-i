package com.mycompany.myapp.repository;

import com.mycompany.myapp.domain.NhomSanPham;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NhomSanPhamRepository extends JpaRepository<NhomSanPham, Long> {
    @Query(value = "SELECT DISTINCT nhom_san_pham FROM nhom_san_pham NhomSanPham", nativeQuery = true)
    public List<NhomSanPham> getAllNhomSanPham();
}
